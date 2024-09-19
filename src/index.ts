import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { ApolloServer, gql } from 'apollo-server-express';
import express, { Application } from 'express';
import { User, UserRole } from './entity/User';

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
  const typeDefs = gql`
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
        const userRepo = (await createConnection()).getRepository(User);
        return userRepo.find();
      },
      user: async (_: any, { id }: { id: number }) => {
        const userRepo = (await createConnection()).getRepository(User);
        return userRepo.findOne({
          where: { id },
        });
      },
    },
    Mutation: {
      createUser: async (_: any, { input }: { input: Partial<User> }) => {
        const userRepo = (await createConnection()).getRepository(User);
        const user = userRepo.create(input);
        await userRepo.save(user);
        return user;
      },
      serializeUser: async (_: any, { id }: { id: number }) => {
        const userRepo = (await createConnection()).getRepository(User);
        const user = await userRepo.findOne({
          where: { id },
        });

        if (!user) {
          throw new Error('User not found');
        }

        return JSON.stringify(user);
      },
      deserializeUser: async (_: any, { serialized }: { serialized: string }) => {
        const deserializedUser: User = JSON.parse(serialized);
        const userRepo = (await createConnection()).getRepository(User);
        const user = userRepo.create(deserializedUser);
        await userRepo.save(user);

        return user;
      },
    },
  };

  // Create Express app and Apollo Server
  const app: Application = express();
  const server = new ApolloServer({ typeDefs, resolvers });

  // Start the Apollo Server
  await server.start();  // Ensure server is started before applying middleware

  // Apply Apollo GraphQL middleware to Express app
  server.applyMiddleware({ app });

  // Start the Express server
  app.listen({ port: 4000 }, () =>
    console.log(`Server ready at http://localhost:4000${server.graphqlPath}`)
  );
};

startServer();
