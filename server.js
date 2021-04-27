const Koa = require("koa");
const Router = require("koa-router");
const StormDB = require("stormdb");

const fsSync = require("fs");
const fs = require("fs/promises");

const multer = require("@koa/multer");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const static = require("koa-static");
const mount = require("koa-mount");
const cors = require("@koa/cors");

const { v4: uuid } = require("uuid");

const app = new Koa();
const router = new Router();
const upload = multer();
const engine = new StormDB.localFileEngine("./stormdb.json");
const db = new StormDB(engine);

const STORAGE_PATH = `${__dirname}/storage`;

if (process.env.NODE_ENV === "development") {
  app.use(logger());
}

/* *******
 * INIT  *
 ******* */

if (!fsSync.existsSync(STORAGE_PATH)) {
  fsSync.mkdirSync(STORAGE_PATH);
}

db.default({ comments: [] });

/* *************
 * MIDDLEWARE  *
 ************* */

app.use(cors());
app.use(bodyParser());
app.use(mount("/static", static(STORAGE_PATH)));

/* *********
 * ROUTES  *
 ********* */

router.post("/upload", upload.any(), async (ctx) => {
  await Promise.all(
    ctx.files.map(async (file) => {
      fs.writeFile(`${STORAGE_PATH}/${file.originalname}`, file.buffer);
    })
  );

  ctx.status = 201;
});

router.get("/files", async (ctx) => {
  ctx.body = await fs.readdir(STORAGE_PATH);
});

router.get("/comments", async (ctx) => {
  ctx.body = db.get("comments").value();
});

router.post("/comments", async (ctx) => {
  const { comment } = ctx.request.body;

  if (!comment) {
    ctx.status = 400;
    ctx.body = "`comment` is required";
  }

  db.get("comments")
    .push({
      id: uuid(),
      value: comment,
    })
    .save();

  ctx.status = 201;
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(8080, () => console.log("Listen on http://localhost:8080"));
