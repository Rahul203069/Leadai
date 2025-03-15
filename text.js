import IORedis from "ioredis";

const redis = new IORedis(
  "redis://default:PgMniMsMvi7i5vWJ91R4JcKbO9YbtnjB@redis-19969.c114.us-east-1-4.ec2.redns.redis-cloud.com:19969"
);
redis.set("foo", "bar");
redis.get("foo", (err, result) => {
  // `result` should be "bar"
  console.log(err, result);
});

redis.ping()
  .then((result) => {
    console.log("Ping response:", result);
    redis.disconnect();
  })
  .catch((error) => {
    console.error("Redis connection error:", error);
  });