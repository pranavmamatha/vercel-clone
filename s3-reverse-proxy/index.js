const express = require("express")
const httpProxy = require("http-proxy")
const dotenv = require("dotenv")

dotenv.config()

const app = express();

const proxy = httpProxy.createProxy()

app.use((req, res) => {
  const hostname = req.hostname;
  const subdomain = hostname.split('.')[0];

  // custom domain - db queries

  const resolveTo = `${process.env.BASE_URL}/${subdomain}`
  return proxy.web(req, res, { target: resolveTo, changeOrigin: true })
})

proxy.on('proxyReq', (proxyReq, req, res) => {
  const url = req.url;
  if (url === "/") {
    proxyReq.path += "index.html"
  }
})

app.listen(process.env.PORT, () => { console.log(`Reverse Proxy Running..${process.env.PORT}`) })
