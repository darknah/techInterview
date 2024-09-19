"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const apollo_server_express_1 = require("apollo-server-express");
const express_1 = __importDefault(require("express"));
const User_1 = require("./entity/User");
const startServer = async () => {
    // Create a connection to the database
    /*   await createConnection({
        type: 'sqlite',
        database: 'test.sqlite',
        synchronize: true,
        logging: false,
        entities: [User],
      }); */
    // Define GraphQL schema
    const typeDefs = (0, apollo_server_express_1.gql) `
    enum UserRole {
      ADMIN
      USER
      GUEST
    }

    type User {
      id: ID!
      name: String!
      email: String!
      role: UserRole!
    }

    type Query {
      users: [User]
      user(id: ID!): User
    }

    input CreateUserInput {
      name: String!
      email: String!
      role: UserRole!
    }

    type Mutation {
      createUser(input: CreateUserInput!): User
      serializeUser(id: ID!): String
      deserializeUser(serialized: String!): User
    }
  `;
    // Resolvers for GraphQL API
    const resolvers = {
        Query: {
            users: async () => {
                const userRepo = (await (0, typeorm_1.createConnection)()).getRepository(User_1.User);
                return userRepo.find();
            },
            user: async (_, { id }) => {
                const userRepo = (await (0, typeorm_1.createConnection)()).getRepository(User_1.User);
                return userRepo.findOne({
                    where: { id },
                });
            },
        },
        Mutation: {
            createUser: async (_, { input }) => {
                const userRepo = (await (0, typeorm_1.createConnection)()).getRepository(User_1.User);
                const user = userRepo.create(input);
                await userRepo.save(user);
                return user;
            },
            serializeUser: async (_, { id }) => {
                const userRepo = (await (0, typeorm_1.createConnection)()).getRepository(User_1.User);
                const user = await userRepo.findOne({
                    where: { id },
                });
                if (!user) {
                    throw new Error('User not found');
                }
                return JSON.stringify(user);
            },
            deserializeUser: async (_, { serialized }) => {
                const deserializedUser = JSON.parse(serialized);
                const userRepo = (await (0, typeorm_1.createConnection)()).getRepository(User_1.User);
                const user = userRepo.create(deserializedUser);
                await userRepo.save(user);
                return user;
            },
        },
    };
    // Create Express app and Apollo Server
    const app = (0, express_1.default)();
    const server = new apollo_server_express_1.ApolloServer({ typeDefs, resolvers });
    // Start the Apollo Server
    await server.start(); // Ensure server is started before applying middleware
    // Apply Apollo GraphQL middleware to Express app
    server.applyMiddleware({ app });
    // Start the Express server
    app.listen({ port: 4000 }, () => console.log(`Server ready at http://localhost:4000${server.graphqlPath}`));
};
startServer();
