import mongoose from "mongoose";
import dns from "dns";

const DEFAULT_MONGODB_DNS_SERVERS = ["1.1.1.1", "8.8.8.8", "8.8.4.4"];

const maskMongoUri = (uri = "") =>
  uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@/]+):([^@/]+)@/i, "$1<user>:<password>@");

const usesLoopbackDns = () =>
  dns
    .getServers()
    .some((server) => server === "127.0.0.1" || server === "::1" || server.startsWith("127."));

const configureMongoDns = () => {
  if (!usesLoopbackDns() && !process.env.MONGODB_DNS_SERVERS) return;

  const servers = process.env.MONGODB_DNS_SERVERS
    ? process.env.MONGODB_DNS_SERVERS.split(",").map((server) => server.trim()).filter(Boolean)
    : DEFAULT_MONGODB_DNS_SERVERS;

  if (!servers.length) return;

  dns.setServers(servers);
  console.log(`MongoDB DNS resolvers: ${servers.join(", ")}`);
};

export const connectDB = async () => {
  try {
    console.log("MONGO_URI:", maskMongoUri(process.env.MONGO_URI));

    if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith("mongodb+srv://")) {
      configureMongoDns();
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};
