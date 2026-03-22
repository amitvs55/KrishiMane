"use client";

import { useState, useRef, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
    role: "user" | "assistant";
    content: string;
    time: string;
}

const SUGGESTIONS = [
    "Which oil is best for heart health?",
    "Compare Sunflower vs Coconut oil",
    "Best oil for deep frying?",
    "Benefits of cold-pressed oils",
    "Which oil is good for hair?",
];

const WELCOME: Message = {
    role: "assistant",
    content:
        "Namaste! 🌿 I'm KrishiMane's AI Advisor. I can help you choose the right oil for your health needs, cooking style, or answer any questions about our products. How can I help you today?",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatWidget({ isOpen, onClose }: ChatWidgetProps) {
    const [messages, setMessages] = useState<Message[]>([WELCOME]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showTyping, setShowTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, showTyping]);

    const getTime = () =>
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;
        const userMsg: Message = { role: "user", content: text, time: getTime() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);
        setShowTyping(true);

        try {
            const response = await fetch(`${API}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    history: messages.map((m) => ({ role: m.role, content: m.content })),
                }),
            });

            if (!response.ok) throw new Error("API error");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantText = "";
            setShowTyping(false);

            const partialMsg: Message = {
                role: "assistant",
                content: "",
                time: getTime(),
            };
            setMessages((prev) => [...prev, partialMsg]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");
                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const data = line.slice(6);
                            if (data === "[DONE]") break;
                            try {
                                const parsed = JSON.parse(data);
                                const token = parsed.token ?? parsed.content ?? "";
                                assistantText += token;
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    updated[updated.length - 1] = {
                                        ...updated[updated.length - 1],
                                        content: assistantText,
                                    };
                                    return updated;
                                });
                            } catch {/* ignore parse errors */ }
                        }
                    }
                }
            }
        } catch {
            setShowTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "I'm having trouble connecting to the server right now. Please make sure the backend is running (`uvicorn main:app --reload` in the `/backend` folder). 🌿",
                    time: getTime(),
                },
            ]);
        } finally {
            setIsLoading(false);
            setShowTyping(false);
        }
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <>
            {/* Floating button */}
            <button
                className="chat-floating-btn"
                onClick={isOpen ? onClose : () => { }}
                id="chat-float-btn"
                title="Open AI Advisor"
            >
                {isOpen ? "✕" : "🤖"}
            </button>

            {/* Chat panel */}
            <div className={`chat-panel ${isOpen ? "" : "hidden"}`} id="chat-panel">
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="chat-avatar">🌿</div>
                        <div>
                            <div className="chat-name">KrishiMane AI Advisor</div>
                            <div className="chat-status">Online</div>
                        </div>
                    </div>
                    <button className="chat-close" onClick={onClose} id="close-chat-btn">
                        ✕
                    </button>
                </div>

                <div className="chat-messages" id="chat-messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`msg msg-${msg.role}`}>
                            <div className="msg-bubble">{msg.content}</div>
                            <div className="msg-time">{msg.time}</div>
                        </div>
                    ))}
                    {showTyping && (
                        <div className="typing-indicator">
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="chat-suggestions">
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            className="suggestion-chip"
                            onClick={() => sendMessage(s)}
                            disabled={isLoading}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="chat-input-row">
                    <input
                        id="chat-input"
                        className="chat-input"
                        placeholder="Ask about oils, health benefits..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        disabled={isLoading}
                        autoComplete="off"
                    />
                    <button
                        id="chat-send"
                        className="chat-send-btn"
                        onClick={() => sendMessage(input)}
                        disabled={isLoading || !input.trim()}
                    >
                        {isLoading ? "⏳" : "➤"}
                    </button>
                </div>
            </div>
        </>
    );
}
