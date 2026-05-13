"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AtSign, Send, Users } from "lucide-react";
import { useChainId, useReadContracts } from "wagmi";
import { agents } from "@/config/agents";
import LogoComponent from "@/components/logo";
import CyberButton from "@/components/cyberButton";
import { swarm_abi, swarmContractAddress } from "@/lib/deployments";
import { Abi } from "viem";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { SwarmActivityPanel, type SwarmEventItem } from "@/components/swarm-activity-panel";
import { ChainBanner } from "@/components/chain-banner";
import Link from "next/link";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  targetAgents?: string[];
  isDirectMessage?: boolean;
  metadata?: unknown;
}

interface TypingState {
  [key: string]: boolean;
}

interface SwarmDetails {
  threadId: string;
  agentCount: bigint;
  createdAt: bigint;
  status: number;
  owner: string;
  agents: string[];
}

const CONTRACT = swarmContractAddress();
const ABI = swarm_abi as Abi;

export default function SwarmChatPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const chainId = useChainId();
  const chainOk = chainId === EXPECTED_CHAIN_ID;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isAgentSelectOpen, setAgentSelectOpen] = useState(false);
  const [swarmDetails, setSwarmDetails] = useState<SwarmDetails | null>(null);
  const [swarmEvents, setSwarmEvents] = useState<SwarmEventItem[]>([]);
  const [typingAgents, setTypingAgents] = useState<TypingState>({});

  const { data: swarmResult, isLoading } = useReadContracts({
    contracts: [
      {
        address: CONTRACT,
        abi: ABI,
        functionName: "getSwarmDetails",
        args: [BigInt(slug || "0")],
      },
      {
        address: CONTRACT,
        abi: ABI,
        functionName: "getSwarmAgents",
        args: [BigInt(slug || "0")],
      },
    ],
    query: {
      enabled: !!slug && chainOk,
    },
  });

  useEffect(() => {
    if (swarmResult && swarmResult.length === 2) {
      const details = swarmResult[0].result as
        | [string, bigint, bigint, number, string]
        | undefined;
      const agentIds = swarmResult[1].result as readonly bigint[] | undefined;
      if (details && agentIds) {
        const [threadId, agentCount, createdAt, status, owner] = details;
        setSwarmDetails({
          threadId,
          agentCount,
          createdAt,
          status,
          owner,
          agents: agentIds
            .map((id) => agents.find((a) => a.num === Number(id))?.id)
            .filter(Boolean) as string[],
        });
      }
    }
  }, [swarmResult]);

  const sendMessage = async (content: string, targetAgents: string[]) => {
    if (!swarmDetails?.threadId) return;
    const newTypingState: TypingState = {};
    targetAgents.forEach((agentId) => {
      newTypingState[agentId] = true;
    });
    setTypingAgents(newTypingState);

    const promises = targetAgents.map(async (agentId) => {
      const agent = agents.find((a) => a.id === agentId);
      if (!agent?.apiendpoint) return null;
      try {
        const response = await fetch(
          `${agent.apiendpoint}/${swarmDetails.threadId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from: "user1", message: content }),
          }
        );
        const data = (await response.json()) as {
          content?: string;
          metadata?: unknown;
        };
        setTypingAgents((prev) => ({ ...prev, [agentId]: false }));
        return {
          id: `${Date.now()}-${agent.id}`,
          content: data.content ?? "",
          senderId: agent.id,
          timestamp: new Date(),
          targetAgents: [agentId],
          isDirectMessage: true,
          metadata: data.metadata,
        } as Message;
      } catch {
        setTypingAgents((prev) => ({ ...prev, [agentId]: false }));
        return null;
      }
    });

    const responses = (await Promise.all(promises)).filter(Boolean) as Message[];
    setMessages((prev) => [...prev, ...responses]);
    setSwarmEvents((prev) => [
      ...prev,
      ...responses
        .filter((r) => r.metadata)
        .map((r) => ({
          agentId: r.senderId,
          timestamp: r.timestamp,
          metadata: r.metadata,
        })),
    ]);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const targets =
      selectedAgents.length > 0 ? selectedAgents : swarmDetails?.agents || [];
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      senderId: "user",
      timestamp: new Date(),
      targetAgents: targets,
      isDirectMessage: selectedAgents.length > 0,
    };
    setMessages((prev) => [...prev, newMessage]);
    sendMessage(inputValue, targets);
    setInputValue("");
    setSelectedAgents([]);
    setAgentSelectOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      <ChainBanner />
      <header className="fixed top-0 w-full z-50 border-b border-purple-500/20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="scale-50 origin-left">
              <LogoComponent />
            </div>
            <div className="h-8 w-px bg-purple-500/20" />
            <span className="text-sm text-purple-300">Swarm #{slug}</span>
            <Link
              href={`/swarm/${slug}/deliberation`}
              className="text-xs text-cyan-300 hover:underline hidden sm:inline"
            >
              Activity
            </Link>
          </div>
          <DynamicWidget />
        </div>
      </header>

      <div className="flex-1 flex pt-16">
        <AgentsSidebar swarmMembers={swarmDetails?.agents || []} />
        <main className="flex-1 flex flex-col min-h-0 h-[calc(100dvh-4rem)] pb-20">
          <div className="flex-1 overflow-y-auto px-4">
            <ChatMessages messages={messages} typingAgents={typingAgents} />
          </div>
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            selectedAgents={selectedAgents}
            setSelectedAgents={setSelectedAgents}
            isAgentSelectOpen={isAgentSelectOpen}
            setAgentSelectOpen={setAgentSelectOpen}
            onSendMessage={handleSendMessage}
            swarmMembers={swarmDetails?.agents || []}
          />
        </main>
        <div className="hidden xl:flex shrink-0">
          <SwarmActivityPanel
            threadId={swarmDetails?.threadId}
            liveEvents={swarmEvents}
          />
        </div>
      </div>
    </div>
  );
}

function AgentsSidebar({ swarmMembers }: { swarmMembers: string[] }) {
  return (
    <aside className="w-64 border-r border-purple-500/20 bg-black/30 backdrop-blur-sm hidden lg:block pt-4 shrink-0">
      <div className="p-4 pt-16">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">Swarm Agents</h2>
        <div className="space-y-2">
          {swarmMembers.map((memberId) => {
            const agent = agents.find((a) => a.id === memberId);
            if (!agent) return null;
            return (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-500/10 transition-colors"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={agent.avatarUrl}
                    alt={agent.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium">{agent.name}</div>
                  <div className="text-xs text-gray-400">{agent.type}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function ChatMessages({
  messages,
  typingAgents,
}: {
  messages: Message[];
  typingAgents: TypingState;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingAgents]);

  return (
    <div className="space-y-2 py-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {Object.entries(typingAgents).map(([agentId, isTyping]) => {
        if (!isTyping) return null;
        const agent = agents.find((a) => a.id === agentId);
        if (!agent) return null;
        return <TypingIndicator key={`typing-${agentId}`} agent={agent} />;
      })}
      <div ref={endRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const sender =
    message.senderId === "user"
      ? { name: "You", avatarUrl: "/avatars/default.svg" }
      : agents.find((a) => a.id === message.senderId);
  if (!sender) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${
        message.senderId === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex ${
          message.senderId === "user" ? "flex-row-reverse" : "flex-row"
        } items-start gap-2 max-w-2xl`}
      >
        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={sender.avatarUrl}
            alt={sender.name}
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-400">{sender.name}</span>
            {message.isDirectMessage && (
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                DM
              </span>
            )}
          </div>
          <div
            className={`rounded-lg p-3 ${
              message.senderId === "user"
                ? "bg-purple-500/20 text-purple-100"
                : "bg-cyan-500/20 text-cyan-100"
            }`}
          >
            {message.content}
          </div>
          {message.targetAgents && (
            <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-400">
              <AtSign className="w-3 h-3 shrink-0" />
              {message.targetAgents.map((targetId) => {
                const target =
                  targetId === "user"
                    ? { name: "You" }
                    : agents.find((a) => a.id === targetId);
                return target?.name ? <span key={targetId}>{target.name} </span> : null;
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ChatInput(props: {
  inputValue: string;
  setInputValue: (v: string) => void;
  selectedAgents: string[];
  setSelectedAgents: (v: string[]) => void;
  isAgentSelectOpen: boolean;
  setAgentSelectOpen: (v: boolean) => void;
  onSendMessage: () => void;
  swarmMembers: string[];
}) {
  const {
    inputValue,
    setInputValue,
    selectedAgents,
    setSelectedAgents,
    isAgentSelectOpen,
    setAgentSelectOpen,
    onSendMessage,
    swarmMembers,
  } = props;
  const toggle = (agentId: string) =>
    setSelectedAgents(
      selectedAgents.includes(agentId)
        ? selectedAgents.filter((id) => id !== agentId)
        : [...selectedAgents, agentId]
    );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 border-t border-purple-500/20 backdrop-blur-sm z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="relative max-w-5xl mx-auto">
          <AgentSelector
            isOpen={isAgentSelectOpen}
            selectedAgents={selectedAgents}
            onToggle={toggle}
            swarmMembers={swarmMembers}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAgentSelectOpen(!isAgentSelectOpen)}
              className={`p-2 rounded-lg ${
                isAgentSelectOpen || selectedAgents.length > 0
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "bg-purple-500/20 text-purple-300"
              }`}
              aria-label="Select agents"
            >
              <Users className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
              placeholder={
                selectedAgents.length > 0
                  ? `Message ${selectedAgents.length} selected agents…`
                  : "Message your swarm…"
              }
              className="flex-1 bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
            <CyberButton onClick={onSendMessage} cyberSize="default" className="px-4">
              <Send className="w-5 h-5" />
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentSelector({
  isOpen,
  selectedAgents,
  onToggle,
  swarmMembers,
}: {
  isOpen: boolean;
  selectedAgents: string[];
  onToggle: (id: string) => void;
  swarmMembers: string[];
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full mb-2 w-full bg-black/90 rounded-lg border border-purple-500/20 p-3 max-h-48 overflow-y-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {swarmMembers.map((memberId) => {
              const agent = agents.find((a) => a.id === memberId);
              if (!agent) return null;
              const isSelected = selectedAgents.includes(agent.id);
              return (
                <button
                  type="button"
                  key={agent.id}
                  onClick={() => onToggle(agent.id)}
                  className={`p-2 rounded-lg border ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-500/20"
                      : "border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20"
                  } transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8">
                      <Image src={agent.avatarUrl} alt="" fill className="object-contain" />
                    </div>
                    <span className="text-sm truncate">{agent.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TypingIndicator({ agent }: { agent: (typeof agents)[number] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
      <div className="flex items-start gap-2 max-w-2xl">
        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
          <Image src={agent.avatarUrl} alt="" width={64} height={64} className="object-contain" />
        </div>
        <div className="mt-6">
          <div className="text-sm font-medium text-gray-400 mb-1">{agent.name}</div>
          <div className="bg-cyan-500/20 rounded-lg p-3 flex items-center gap-1">
            {[0, 0.2, 0.4].map((d) => (
              <motion.div
                key={d}
                className="w-2 h-2 bg-cyan-300 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: d }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
