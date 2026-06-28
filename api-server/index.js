import express from "express"
import { generateSlug } from "random-word-slugs"
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs"
import { Server } from "socket.io"
import Redis from "ioredis"
import { drizzle } from "drizzle-orm/node-postgres"
import { z } from "zod"
import { projectsTable, userTable } from "./db/schema.js"
import dotenv from "dotenv";

dotenv.config();

const app = express();
const db = drizzle(process.env.DATABASE_URL);
// const subscriber = new Redis(process.env.REDIS)
//
// const io = new Server({ cors: "*" })
//
// io.on('connection', socket => {
//   socket.on("subscribe", channel => {
//     socket.join(channel)
//     socket.emit("message", `Joined ${channel}`)
//   })
// })
//
// io.listen(process.env.SOCKET_PORT, () => {
//   console.log("Socker server listening at", process.env.SOCKET_PORT)
// })

const region = process.env.AWS_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const ecsClient = new ECSClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
})

app.use(express.json())

app.post("/signin", async (req, res) => {
  const schema = z.object({
    username: z.string(),
    email: z.email(),
    password: z.string()
  })
  const safeParseResult = schema.safeParse(req.body);
  if (safeParseResult.error) return res.status(400).json({ error: safeParseResult.error })
  try {
    const { username, email, password } = safeParseResult.data;
    const createUser = await db.insert(userTable).values({
      userName: username,
      email,
      password
    })
    console.log(createUser)
    return res.json({ message: "Successfully created the user" });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal Server Error" })
  }
})


app.post("/projects", async (req, res) => {
  const schema = z.object({
    name: z.string(),
    gitUrl: z.string(),
    userId: z.string(),
    subDomain: z.string().optional()
  })

  const safeParseResult = schema.safeParse(req.body);
  if (safeParseResult.error) return res.status(400).json({ error: safeParseResult.error })

  const { userId, name, gitUrl, } = safeParseResult.data
  const createProject = await db.insert(projectsTable).values({
    projectName: name,
    projectOwner: userId,
    gitUrl: gitUrl,
    subDomain: subDomain || generateSlug()
  })
  res.json({ status: "success", data: createProject })
})




app.post("/deploy", async (req, res) => {
  const { gitURL } = req.body;
  const projectSlug = generateSlug();

  // Spin docker containers
  const command = new RunTaskCommand({
    cluster: process.env.AWS_CLUSTER_ARN,
    taskDefinition: process.env.AWS_TASK_DEFINITION_ARN,
    launchType: 'FARGATE',
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: 'ENABLED',
        securityGroups: [
          process.env.SECURITY_GROUP_1
        ],
        subnets: [
          process.env.SUBNET_1,
          process.env.SUBNET_2,
          process.env.SUBNET_3
        ]
      }
    },
    overrides: {
      containerOverrides: [
        {
          name: 'builder-image',
          environment: [
            { name: 'GIT_REPOSITORY_URL', value: gitURL },
            { name: 'PROJECT_ID', value: projectSlug }
          ]
        }
      ]
    }
  })

  await ecsClient.send(command);

  return res.json({ status: "queued", data: { projectSlug, url: `http://${projectSlug}.localhost:8000` } })
})

async function initRedisSubscribe() {
  console.log("Subscribed to logs...")
  subscriber.psubscribe(`logs:${projectSlug}`)
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", message)
  })
}

// initRedisSubscribe()

app.listen(process.env.PORT, () => {
  console.log("API server running in port", process.env.PORT)
})
