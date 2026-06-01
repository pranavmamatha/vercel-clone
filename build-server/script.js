const { exec } = require("child_process")
const path = require("path")
const fs = require("fs")
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
const { lookup } = require("mime-types")
const Redis = require('ioredis')
require("dotenv").config()

const publisher = new Redis(process.env.REDIS);

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.S3_BUCKET

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

const PROJECT_ID = process.env.PROJECT_ID

function publishLog(log) {
  publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }))
}

async function init() {
  console.log("Executing script.js")
  console.log('Build Started...')
  publishLog('Build Started...')
  const outDirPath = path.join(__dirname, "output")
  const child = exec(`cd ${outDirPath} && npm install && npm run build`)

  child.stdout.on("data", function(data) {
    console.log(data.toString())
    publishLog(data.toString())
  })

  child.stderr.on("data", function(data) {
    console.log('Error', data.toString())
    publishLog(`error: ${data.toString()}`)
  })

  child.on("close", async function() {
    console.log("Build Completed")
    publishLog(`Build Completed`)
    const distDirPath = path.join(__dirname, "output", "dist")
    const distDirContent = fs.readdirSync(distDirPath, { recursive: true })
    console.log("starting to upoad")
    publishLog("Starting to upload")
    for (const filePath of distDirContent) {
      console.log("Uploading", filePath)
      publishLog(`uploading ${filePath}`)
      const fullPath = path.join(distDirPath, filePath)
      if (fs.lstatSync(fullPath).isDirectory()) continue;
      const relativePath = path.relative(distDirPath, fullPath)

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `__outputs/${PROJECT_ID}/${relativePath}`,
        Body: fs.createReadStream(fullPath),
        ContentType: lookup(fullPath) || "application/octet-stream"
      })

      await s3Client.send(command)
      publishLog(`uploaded ${filePath}`)
      console.log("Uploaded", filePath)
    }
    console.log("Done...")
    publishLog(`Done...`)
  })
}

init()
