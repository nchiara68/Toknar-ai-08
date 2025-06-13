import { generateClient } from "aws-amplify/api";
import { Schema } from "../amplify/data/resource";
import { createAIHooks } from "@aws-amplify/ui-react-ai";

// 🔧 Generate Amplify client with proper typing
export const client = generateClient<Schema>({ authMode: "userPool" });

// 🤖 Create AI hooks from the client
export const { useAIConversation, useAIGeneration } = createAIHooks(client);

console.log('✅ AI client and hooks configured for Stage 2');