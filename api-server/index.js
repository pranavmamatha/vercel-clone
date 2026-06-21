const express = require("express")
const { generateSlug } = require("random-word-slugs")
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs")
const { Server } = require("socket.io")
const Redis = require("ioredis")
const { drizzle } = require("drizzle-orm/node-postgres")

const app = express();
require("dotenv").config()

const db = drizzle(process.env.DATABASE_URL);
const subscriber = new Redis(process.env.REDIS)

const io = new Server({ cors: "*" })

io.on('connection', socket => {
  socket.on("subscribe", channel => {
    socket.join(channel)
    socket.emit("message", `Joined ${channel}`)
  })
})

io.listen(process.env.SOCKET_PORT, () => {
  console.log("Socker server listening at", process.env.SOCKET_PORT)
})

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

app.post("/projects", async (req, res) => {
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

initRedisSubscribe()

app.listen(process.env.PORT, () => {
  console.log("API server running in port", process.env.PORT)
})
