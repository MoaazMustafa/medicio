"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  Chip,
} from "@heroui/react";

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    { sender: "bot", text: "Hello! I am your Medicio AI Triage Assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `Thank you for details. Based on your description ("${userMsg}"), our clinical NLP classifier is routing precautions to your profile. Please check if you experience symptoms like chest tightness or extreme fatigue.`,
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <section className="flex flex-col items-center justify-center gap-8 py-12 md:py-16 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <Chip variant="primary" color="accent" className="px-3 py-0.5 text-xs font-mono uppercase">
          Module M2 Active
        </Chip>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          Medicio AI Chatbot
        </h1>
        <p className="text-sm text-text-secondary max-w-lg">
          Conversational clinical agent. Your session is dynamically mapped to triage referrers.
        </p>
      </div>

      {/* Chat Window Card */}
      <Card className="w-full max-w-2xl border border-border-custom bg-surface/50 backdrop-blur-md shadow-xl flex flex-col h-[500px]">
        <CardHeader className="p-4 border-b border-border-custom flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-semibold text-text-primary">Clinical Triage Core v1.0</span>
          </div>
          <Chip size="sm" variant="secondary" color="default">
            Telemetry Synced
          </Chip>
        </CardHeader>

        {/* Messages Body */}
        <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-[300px]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.sender === "user"
                    ? "bg-primary text-white rounded-br-none"
                    : "bg-background-custom/40 text-text-primary border border-border-custom rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-background-custom/40 text-text-primary border border-border-custom rounded-2xl rounded-bl-none px-4 py-2.5 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </CardContent>

        <hr className="border-t border-border-custom" />

        {/* Input Footer */}
        <CardFooter className="p-3 bg-surface/30">
          <div className="flex gap-2 w-full">
            <Input
              placeholder="Type symptom description (e.g. slight sore throat since morning)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
            />
            <Button
              variant="primary"
              onPress={handleSend}
              isDisabled={loading || !input.trim()}
              className="font-semibold px-5"
            >
              Send
            </Button>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
}
