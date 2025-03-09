import { openAIAgent } from "@graphai/openai_agent"
import * as vanilla_agents from "@graphai/vanilla";
import { GraphAI } from "graphai"
import { useState } from "react";

const graph_data = {
  version: 0.5,
  loop: {
    while: ":continue",
  },
  nodes: {
    messages: {
      // Holds the conversation, array of messages.
      value: [
        {
          role: "system",
          content:
            "You are a assistants. please support users following instrunctions",
        },
      ],
      update: ":reducer.array.$0",
      isResult: true,
    },
    userInput: {
      value: "",
    },
    llm_prompt: {
      agent: "openAIAgent",
      inputs: { messages: ":messages", prompt: ":userInput" },
    },
    output: {
      // Displays the response to the user.
      agent: "stringTemplateAgent",
      console: {
        after: true,
      },
      inputs: {
        text: "\x1b[32mAgent\x1b[0m: ${:llm_prompt.text}",
      },
    },
    appendUserMessage: {
        agent: "pushAgent",
        inputs: {
          array: ":messages",
          item: {
            role: "user",
            content: ":userInput",
          },
        },
      },
    appendAssistantMessage: {
        agent: "pushAgent",
        inputs: {
          array: ":appendUserMessage.array",
          item: {
            role: "assistant",
            content: ":llm_prompt.text",
          },
        },
      },
    reducer: {
      // Receives messages from either case.
      agent: "copyAgent",
      anyInput: true,
      inputs: { array: [":appendAssistantMessage.array"] },
    },
  },
};

const graph = new GraphAI(graph_data, { ...vanilla_agents, openAIAgent});    

export function useChat({initialInput = ""}) {
    const [input, setInput] = useState(initialInput);
    const [messages, setMessages] = useState<{role: string, content: string, id: string}[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await callAssistant(input);
        setMessages([...messages, { role: "user", content: input, id: crypto.randomUUID()}, { role: "assistant", content: response, id: crypto.randomUUID() }]);
        setInput("");
    };

    return { messages, input, handleInputChange, handleSubmit };
}

export async function callAssistant(message: string, result?: any) {
     if (result) {
         graph.initializeGraphAI();
         graph.injectValue("messages", result.messages);
       }
       graph.injectValue("userInput", message);
       return await graph.run();
  }
  

export async function main() {
    let response = await callAssistant("yo man");
    let userInput = "";
    console.log(`please input or say bye`);
    while (userInput !== "bye") {
      userInput = await new Promise<string>((resolve) => {
        process.stdin.once("data", (data) => resolve(data.toString().trim()));
      });
      if (userInput !== "bye") {
        response = await callAssistant(userInput, response);
        console.log("response");
        console.log(response);
      }
    }
  }
  