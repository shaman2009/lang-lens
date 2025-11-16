# 核心代码链路详解 (Code Flow Documentation)

本文档详细解释 LangLens 的核心代码执行链路，包括应用启动、消息流转、实时流式传输等关键流程。

## 目录

- [应用启动链路](#应用启动链路)
- [消息发送与接收链路](#消息发送与接收链路)
- [实时流式传输链路](#实时流式传输链路)
- [Thread 管理链路](#thread-管理链路)
- [状态管理链路](#状态管理链路)
- [Todo 提取链路](#todo-提取链路)
- [消息渲染链路](#消息渲染链路)
- [数据缓存与同步链路](#数据缓存与同步链路)

---

## 应用启动链路

### 1. 应用入口与初始化

**调用栈：**
```
浏览器访问 http://localhost:3000
  ↓
src/app/layout.tsx (RootLayout)
  ↓
src/app/workspace/layout.tsx (WorkspaceLayout)
  ↓
src/app/workspace/threads/[threadId]/page.tsx (ThreadPage)
```

### 详细流程

#### 1.1 Root Layout 初始化

**文件位置：** `src/app/layout.tsx`

```typescript
// Root Layout 职责：
// 1. 设置 HTML 基础结构
// 2. 初始化主题系统 (ThemeProvider)
// 3. 加载全局样式
// 4. 配置字体

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### 1.2 Workspace Layout 初始化

**文件位置：** `src/app/workspace/layout.tsx`

```typescript
const queryClient = new QueryClient();

export default function WorkspaceLayout({ children }) {
  return (
    // 1. 初始化 TanStack Query Client
    <QueryClientProvider client={queryClient}>
      {/* 2. 初始化侧边栏系统 */}
      <SidebarProvider>
        {/* 3. 渲染侧边栏 */}
        <WorkspaceSidebar />
        {/* 4. 渲染主内容区域 */}
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
```

**核心职责：**
1. **创建 QueryClient 实例** - 全局单例，管理所有服务端状态
2. **提供 Query 上下文** - 使所有子组件可以使用 Query hooks
3. **初始化侧边栏** - 设置响应式侧边栏系统
4. **渲染工作区布局** - 侧边栏 + 主内容区

#### 1.3 LangGraph Client 初始化

**文件位置：** `src/lib/api/client.ts`

```typescript
import { Client } from "@langchain/langgraph-sdk/client";

// 全局单例 - 应用启动时创建一次
export const apiClient = new Client({
  apiUrl: "http://localhost:2024"
});
```

**特点：**
- **单例模式** - 整个应用共享一个客户端实例
- **连接管理** - 自动管理与 LangGraph 服务器的连接
- **WebSocket 连接池** - 复用连接以提高性能

---

## 消息发送与接收链路

### 2. 用户发送消息的完整流程

**完整调用栈：**
```
用户在 InputBox 输入消息并点击发送
  ↓
InputBox.handleSubmit (src/components/input-box.tsx:35-47)
  ↓
ThreadPage.handleSubmit (src/app/workspace/threads/[threadId]/page.tsx:84-142)
  ↓
thread.submit() - LangGraph SDK
  ↓
WebSocket/SSE 流式传输到 LangGraph 服务器
  ↓
服务器处理并返回流式响应
  ↓
useStream hook 接收并更新状态
  ↓
Messages 组件重新渲染显示新消息
```

### 详细代码流程

#### 2.1 InputBox 组件接收用户输入

**文件：** `src/components/input-box.tsx`

```typescript
export function InputBox({ onSubmit, onStop, status, ... }) {
  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      // 1. 如果正在流式传输，点击发送按钮会停止流式传输
      if (status === "streaming") {
        onStop?.();
        return;
      }

      // 2. 验证消息内容
      if (!message.text) {
        return;
      }

      // 3. 调用父组件的 onSubmit 回调
      onSubmit?.(message);
    },
    [onStop, onSubmit, status],
  );

  return (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea placeholder="How can I assist you today?" />
      <PromptInputSubmit status={status} />
    </PromptInput>
  );
}
```

**核心功能：**
1. 接收用户输入
2. 处理发送/停止按钮逻辑
3. 将消息传递给父组件

#### 2.2 ThreadPage 处理消息提交

**文件：** `src/app/workspace/threads/[threadId]/page.tsx`

```typescript
export default function ThreadPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assistantId = searchParams.get("assistantId");
  const [threadId, setThreadId] = useState<string | null>(null);
  const { threadId: threadIdFromPath } = useParams();
  const isNew = useMemo(() => threadIdFromPath === "new", [threadIdFromPath]);

  // 初始化 threadId
  useEffect(() => {
    if (threadIdFromPath !== "new") {
      setThreadId(threadIdFromPath);
    } else {
      // 新 thread：客户端生成 UUID
      setThreadId(uuid());
    }
  }, [threadIdFromPath]);

  // 核心：初始化流式传输 hook
  const thread = useStream<MessageThreadValues>({
    client: apiClient,              // 全局 LangGraph 客户端
    assistantId: assistantId!,      // 选中的助手 ID
    threadId: !isNew ? threadId : undefined,  // 新 thread 不传 threadId
    reconnectOnMount: true,         // 组件挂载时自动重连
    fetchStateHistory: true,        // 获取历史消息
  });

  // 消息提交处理函数
  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      // 步骤 1：如果是新 thread，乐观更新缓存
      if (isNew) {
        queryClient.setQueryData(
          ["threads", "search", { limit: 50, sortBy: "updated_at", sortOrder: "desc" }],
          (oldData: Array<unknown>) => {
            return [
              {
                thread_id: threadId,
                metadata: { assistant_id: assistantId, graph_id: assistantId },
                values: {
                  messages: [{
                    type: "human",
                    content: [{ type: "text", text: message.text }],
                  }],
                },
              },
              ...oldData,
            ];
          },
        );

        // 步骤 2：更新 URL（从 /new 跳转到实际 threadId）
        router.replace(
          `/workspace/threads/${threadId}?assistantId=${assistantId}&autoFocus=true`,
        );
      }

      // 步骤 3：提交消息到 LangGraph 服务器
      await thread.submit(
        {
          messages: [
            {
              type: "human",
              content: [{ type: "text", text: message.text! }],
            } as HumanMessage,
          ],
        },
        {
          threadId: isNew ? threadId! : undefined,  // 新 thread 传递生成的 threadId
          streamSubgraphs: true,     // 启用子图流式传输
          streamResumable: true,      // 启用可恢复流式传输
        },
      );

      // 步骤 4：刷新 threads 列表缓存
      void queryClient.invalidateQueries({ queryKey: ["threads", "search"] });
    },
    [assistantId, isNew, queryClient, router, thread, threadId],
  );

  return (
    <WorkspaceContainer>
      <WorkspaceContent>
        <Messages thread={thread} />
      </WorkspaceContent>
      <WorkspaceFooter>
        <InputBox
          status={thread.isLoading ? "streaming" : "ready"}
          onSubmit={handleSubmit}
          onStop={() => thread.stop()}
        />
      </WorkspaceFooter>
    </WorkspaceContainer>
  );
}
```

**关键点分析：**

1. **新 Thread 的特殊处理**
   - URL 是 `/workspace/threads/new` 时，客户端生成 UUID
   - 第一次提交消息时，传递这个 UUID 给服务器
   - 服务器用这个 UUID 创建 thread
   - 客户端更新 URL 到实际的 thread ID

2. **乐观更新（Optimistic Update）**
   ```typescript
   queryClient.setQueryData(["threads", "search", ...], (oldData) => {
     return [newThread, ...oldData];  // 立即在列表顶部添加新 thread
   });
   ```
   - 不等服务器响应，立即更新 UI
   - 用户感觉更快响应
   - 如果失败，会回滚（TanStack Query 自动处理）

3. **URL 更新**
   ```typescript
   router.replace(`/workspace/threads/${threadId}?...`);
   ```
   - 从 `/new` 跳转到实际 thread ID
   - 使用 `replace` 而不是 `push`，避免历史记录中有 `/new`

#### 2.3 useStream Hook 内部机制

**工作原理：** `useStream` 是 LangGraph SDK 提供的 React Hook

```typescript
const thread = useStream<MessageThreadValues>({
  client: apiClient,
  assistantId: "my-assistant",
  threadId: "thread-123",
  reconnectOnMount: true,
  fetchStateHistory: true,
});

// 返回的 thread 对象包含：
thread = {
  // 状态
  isLoading: boolean,           // 是否正在流式传输
  error: Error | null,          // 错误信息
  values: MessageThreadValues,  // 当前 thread 数据
  messages: BaseMessage[],      // 消息列表

  // 方法
  submit: (input, config) => Promise<void>,  // 提交消息
  stop: () => void,                          // 停止流式传输
  setBranch: (branch) => void,               // 切换分支
  getMessagesMetadata: (msg) => Metadata,    // 获取消息元数据
}
```

**内部流程：**

1. **初始化时**
   ```typescript
   // fetchStateHistory: true
   GET http://localhost:2024/threads/{threadId}/history
   // 加载历史消息到 thread.messages
   ```

2. **提交消息时**
   ```typescript
   // 建立 WebSocket/SSE 连接
   WebSocket: ws://localhost:2024/threads/{threadId}/stream

   // 发送消息
   {
     "messages": [{ "type": "human", "content": "Hello" }],
     "threadId": "thread-123",
     "streamSubgraphs": true
   }
   ```

3. **接收流式响应**
   ```typescript
   // 服务器发送流式事件
   event: message
   data: { type: "ai", content: "Hello! How", id: "msg-1" }

   event: message
   data: { type: "ai", content: "Hello! How can I", id: "msg-1" }

   event: message
   data: { type: "ai", content: "Hello! How can I help?", id: "msg-1" }

   // useStream 自动更新 thread.messages
   // React 重新渲染 Messages 组件
   ```

---

## 实时流式传输链路

### 3. 流式传输的详细机制

**流式传输架构：**

```
LangLens UI                    LangGraph Server
    │                               │
    │  1. 建立 WebSocket 连接       │
    ├──────────────────────────────►│
    │                               │
    │  2. 发送消息 (JSON)            │
    ├──────────────────────────────►│
    │                               │
    │                               │ 3. AI 处理消息
    │                               │    ├─ 调用 LLM
    │                               │    ├─ 执行工具
    │                               │    └─ 生成响应
    │                               │
    │  4. 流式返回 token             │
    │◄──────────────────────────────┤ event: token
    │◄──────────────────────────────┤ event: token
    │◄──────────────────────────────┤ event: token
    │                               │
    │  5. 返回完整消息                │
    │◄──────────────────────────────┤ event: message
    │                               │
    │  6. 返回工具调用                │
    │◄──────────────────────────────┤ event: tool_call
    │                               │
    │  7. 返回工具结果                │
    │◄──────────────────────────────┤ event: tool_message
    │                               │
    │  8. 流式传输完成                │
    │◄──────────────────────────────┤ event: end
```

### 流式事件类型

**LangGraph 服务器发送的事件类型：**

1. **token** - AI 生成的单个 token
   ```json
   {
     "type": "token",
     "content": "Hello",
     "message_id": "msg-123"
   }
   ```

2. **message** - 完整的消息更新
   ```json
   {
     "type": "ai",
     "id": "msg-123",
     "content": "Hello! How can I help you today?",
     "tool_calls": []
   }
   ```

3. **tool_call** - AI 调用工具
   ```json
   {
     "type": "ai",
     "id": "msg-456",
     "tool_calls": [{
       "name": "search",
       "args": { "query": "weather in SF" },
       "id": "call-789"
     }]
   }
   ```

4. **tool_message** - 工具执行结果
   ```json
   {
     "type": "tool",
     "tool_call_id": "call-789",
     "content": "Current temperature: 72°F"
   }
   ```

5. **end** - 流式传输结束
   ```json
   {
     "type": "end"
   }
   ```

### useStream Hook 处理流式事件

**内部状态更新机制：**

```typescript
// useStream 内部伪代码
function useStream(config) {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const submit = async (input, options) => {
    setIsLoading(true);

    // 建立流式连接
    const stream = await client.threads.stream(input, options);

    for await (const event of stream) {
      switch (event.type) {
        case 'token':
          // 更新最后一条 AI 消息的内容
          setMessages(prev => updateLastMessage(prev, event.content));
          break;

        case 'message':
          // 添加或更新完整消息
          setMessages(prev => upsertMessage(prev, event));
          break;

        case 'tool_call':
          // 添加工具调用到 AI 消息
          setMessages(prev => addToolCall(prev, event));
          break;

        case 'tool_message':
          // 添加工具结果消息
          setMessages(prev => [...prev, event]);
          break;

        case 'end':
          setIsLoading(false);
          break;
      }
    }
  };

  return { messages, isLoading, submit };
}
```

---

## Thread 管理链路

### 4. Thread CRUD 操作

#### 4.1 获取 Thread 列表

**调用链路：**
```
ThreadsPage 组件挂载
  ↓
useThreads() hook (src/lib/api/hooks.ts:7-22)
  ↓
TanStack Query 检查缓存
  ↓
如果缓存过期或不存在，调用 queryFn
  ↓
apiClient.threads.search({ limit: 50, sortBy: "updated_at" })
  ↓
GET http://localhost:2024/threads?limit=50&sortBy=updated_at
  ↓
返回 Thread 列表
  ↓
TanStack Query 缓存结果
  ↓
组件渲染列表
```

**代码实现：**

```typescript
// src/lib/api/hooks.ts
export function useThreads(
  params = {
    limit: 50,
    sortBy: "updated_at",
    sortOrder: "desc",
  },
) {
  return useQuery<MessageThread[]>({
    // Query Key - 用于缓存标识
    queryKey: ["threads", "search", params],

    // Query Function - 实际获取数据的函数
    queryFn: async () => {
      const response = await apiClient.threads.search<MessageThreadValues>(params);
      return response as MessageThread[];
    },

    // 可选配置（从 QueryClient 默认配置继承）
    // staleTime: 5 * 60 * 1000,      // 5 分钟后数据过期
    // gcTime: 15 * 60 * 1000,         // 15 分钟后垃圾回收
    // refetchOnWindowFocus: false,   // 窗口聚焦时不自动重新获取
  });
}

// 使用示例
function ThreadsPage() {
  const { data, isLoading, error, refetch } = useThreads();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ThreadsList threads={data} />
  );
}
```

#### 4.2 删除 Thread

**调用链路：**
```
用户点击删除按钮
  ↓
deleteThread.mutate({ threadId: "thread-123" })
  ↓
mutationFn 执行
  ↓
apiClient.threads.delete(threadId)
  ↓
DELETE http://localhost:2024/threads/thread-123
  ↓
onSuccess 回调
  ↓
乐观更新所有 threads 查询缓存
  ↓
UI 立即更新，删除的 thread 从列表消失
```

**代码实现：**

```typescript
// src/lib/api/hooks.ts
export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    // Mutation Function - 执行删除操作
    mutationFn: async ({ threadId }: { threadId: string }) => {
      await apiClient.threads.delete(threadId);
    },

    // 成功回调 - 更新缓存
    onSuccess(_, { threadId }) {
      // 更新所有匹配的 threads 查询缓存
      queryClient.setQueriesData(
        {
          queryKey: ["threads", "search"],
          exact: false,  // 匹配所有 ["threads", "search", ...] 的查询
        },
        (oldData: Array<MessageThread>) => {
          // 从列表中过滤掉已删除的 thread
          return oldData.filter((t) => t.thread_id !== threadId);
        },
      );
    },
  });
}

// 使用示例
function ThreadItem({ thread }) {
  const deleteThread = useDeleteThread();

  const handleDelete = () => {
    deleteThread.mutate({ threadId: thread.thread_id });
  };

  return (
    <div>
      <h3>{thread.thread_id}</h3>
      <Button onClick={handleDelete} disabled={deleteThread.isPending}>
        {deleteThread.isPending ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
```

**乐观更新的优势：**
1. **立即响应** - 不等服务器确认，UI 立即更新
2. **更好的用户体验** - 感觉更快
3. **自动回滚** - 如果服务器返回错误，TanStack Query 自动恢复原始数据

---

## 状态管理链路

### 5. 数据在组件间的流转

**状态分类与管理：**

```
┌─────────────────────────────────────────────────────────┐
│                     应用状态层次                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 1. Server State (TanStack Query)                │  │
│  │   - Threads 列表                                 │  │
│  │   - Assistants 列表                              │  │
│  │   - Thread 详情                                  │  │
│  │   缓存时间: 5-15 分钟                            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 2. Streaming State (useStream)                  │  │
│  │   - 当前 thread 的实时消息                      │  │
│  │   - 流式传输状态                                │  │
│  │   - WebSocket 连接状态                          │  │
│  │   实时更新，无缓存                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 3. UI State (React useState/useReducer)         │  │
│  │   - 侧边栏展开/折叠                             │  │
│  │   - 输入框内容                                  │  │
│  │   - 模态框显示/隐藏                             │  │
│  │   组件本地，不共享                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 4. URL State (Next.js Router)                   │  │
│  │   - 当前 threadId                               │  │
│  │   - 选中的 assistantId                          │  │
│  │   - 搜索参数                                    │  │
│  │   同步到 URL，可分享                            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 5. Local Storage (浏览器存储)                  │  │
│  │   - 默认 assistantId                            │  │
│  │   - 主题偏好                                    │  │
│  │   持久化，跨会话                                │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 状态流转示例

**场景：用户选择一个 Assistant 并创建新对话**

```typescript
// 步骤 1: 用户点击 Assistant
function AssistantCard({ assistant }) {
  const router = useRouter();

  const handleClick = () => {
    // 更新 URL State
    router.push(`/workspace/threads/new?assistantId=${assistant.graph_id}`);

    // 更新 Local Storage
    localStorage.setItem("lang-lens/default_assistant_id", assistant.graph_id);
  };

  return <Card onClick={handleClick}>{assistant.name}</Card>;
}

// 步骤 2: ThreadPage 读取 URL State
function ThreadPage() {
  const searchParams = useSearchParams();
  const assistantId = searchParams.get("assistantId");  // 从 URL 读取

  // 步骤 3: 初始化 Streaming State
  const thread = useStream({
    assistantId: assistantId!,
    // ...
  });

  // 步骤 4: 用户发送消息
  const handleSubmit = async (message) => {
    // 更新 Server State (乐观更新)
    queryClient.setQueryData(["threads", "search", ...], (old) => {
      return [newThread, ...old];
    });

    // 提交到流式传输
    await thread.submit(message);

    // 刷新 Server State
    queryClient.invalidateQueries(["threads", "search"]);
  };
}
```

---

## Todo 提取链路

### 6. 从 AI 消息中提取 Todo

**场景：** AI 使用 `write_todos` 或 `todo_write` 工具调用来创建任务队列

**提取流程：**

```
AI 生成响应，包含 tool_calls
  ↓
useStream 接收 AIMessage 并更新 thread.messages
  ↓
useEffect 监听 thread.messages 变化
  ↓
过滤所有包含 todo tool_calls 的 AI 消息
  ↓
找到最后一个 todo tool_call
  ↓
提取 args.todos
  ↓
更新 todos 状态
  ↓
Todos 组件渲染任务列表
```

**代码实现：**

```typescript
// src/app/workspace/threads/[threadId]/page.tsx:57-80
export default function ThreadPage() {
  const thread = useStream(/* ... */);
  const [todos, setTodos] = useState<QueueTodo[]>([]);

  // 监听消息变化，提取 todos
  useEffect(() => {
    // 步骤 1: 过滤包含 todo tool_calls 的 AI 消息
    const todoCallMessages = thread.messages.filter(
      (message) =>
        message.type === "ai" &&
        message.tool_calls?.some(
          (toolCall) =>
            toolCall.name === "write_todos" || toolCall.name === "todo_write",
        ),
    );

    // 步骤 2: 如果没有 todo 消息，退出
    if (todoCallMessages.length === 0) {
      return undefined;
    }

    // 步骤 3: 获取最后一个 todo 消息
    const lastTodoCallMessage = todoCallMessages[
      todoCallMessages.length - 1
    ] as AIMessage;

    // 步骤 4: 找到 write_todos/todo_write 工具调用
    const lastTodoToolCall = lastTodoCallMessage.tool_calls!.find(
      (toolCall) =>
        toolCall.name === "write_todos" || toolCall.name === "todo_write",
    )!;

    // 步骤 5: 提取 todos 并更新状态
    if (lastTodoToolCall.args.todos) {
      setTodos(lastTodoToolCall.args.todos);
    }
  }, [thread.messages]);  // 依赖 thread.messages

  return (
    <WorkspaceContainer>
      {/* 渲染 Todos 组件 */}
      <Todos todos={todos} />
      <Messages thread={thread} />
    </WorkspaceContainer>
  );
}
```

**Todo 数据结构：**

```typescript
interface QueueTodo {
  content: string;       // 任务描述（祈使句）
  status: "pending" | "in_progress" | "completed";
  activeForm: string;    // 进行中形式（现在进行时）
}

// AI tool_call 示例
{
  "type": "ai",
  "tool_calls": [{
    "name": "write_todos",
    "args": {
      "todos": [
        {
          "content": "Fix authentication bug",
          "activeForm": "Fixing authentication bug",
          "status": "in_progress"
        },
        {
          "content": "Update documentation",
          "activeForm": "Updating documentation",
          "status": "pending"
        }
      ]
    },
    "id": "call-123"
  }]
}
```

**为什么只取最后一个 todo tool_call？**

在一个对话中，AI 可能多次调用 `write_todos`：
- 第一次：创建初始任务列表
- 第二次：更新任务状态（标记完成）
- 第三次：添加新任务

最后一次调用代表最新的任务状态，所以只使用最后一个。

---

## 消息渲染链路

### 7. 消息的渲染流程

**渲染链路：**

```
thread.messages 更新
  ↓
Messages 组件重新渲染 (src/components/messages.tsx:48-77)
  ↓
遍历 messages 数组
  ↓
过滤掉 tool 类型消息 (shouldRender)
  ↓
为每个消息渲染 MessageItem
  ↓
MessageItem 根据消息类型渲染不同内容
  ├─ HumanMessage → 用户消息气泡
  ├─ AIMessage → AI 响应气泡
  │   ├─ MessageContent → Markdown 渲染
  │   └─ ToolCalls → 工具调用卡片
  └─ ToolMessage → 不渲染（已过滤）
```

**代码实现：**

```typescript
// src/components/messages.tsx
export function Messages({ thread }) {
  return (
    <Conversation>
      <ConversationContent>
        {/* 遍历所有消息 */}
        {thread.messages.map((message) =>
          shouldRender(message) && (
            <MessageItem
              key={message.id}
              message={message}
              thread={thread}
            />
          ),
        )}

        {/* 流式传输时显示加载动画 */}
        {thread.isLoading && <LoadingAnimation />}
      </ConversationContent>

      {/* 自动滚动按钮 */}
      <ConversationScrollButton />
    </Conversation>
  );
}

// 过滤函数：不渲染 ToolMessage
function shouldRender(message: Message) {
  if (message.type === "tool") {
    return false;  // ToolMessage 不单独显示
  }
  return true;
}
```

**MessageItem 渲染逻辑：**

```typescript
export function MessageItem({ message, thread }) {
  const metadata = thread.getMessagesMetadata(message);

  // 确定消息来源
  const from = message.type === "human" ? "user" : "assistant";

  // 分支信息（用于时间旅行）
  const branch = metadata?.branch ?? "main";
  const branches = metadata?.branchOptions ?? ["main"];

  return (
    <ConversationMessage from={from}>
      {/* 消息内容 */}
      <ConversationMessageContent>
        <MessageContentWithToolCalls message={message} thread={thread} />
      </ConversationMessageContent>

      {/* 工具栏（复制、编辑、重新生成） */}
      {showToolbar && (
        <MessageToolbar>
          <BranchSwitch value={branch} options={branches} />
          <Button onClick={handleCopy}>Copy</Button>
          <Button onClick={handleEdit}>Edit</Button>
          <Button onClick={handleRegenerate}>Regenerate</Button>
        </MessageToolbar>
      )}
    </ConversationMessage>
  );
}
```

**消息内容渲染：**

```typescript
function MessageContentWithToolCalls({ message, thread }) {
  return (
    <>
      {/* 渲染文本内容（Markdown） */}
      {extractContents(message).map((content, index) => (
        <MessageContent key={index} isLoading={thread.isLoading}>
          {content}
        </MessageContent>
      ))}

      {/* 渲染工具调用 */}
      <ToolCalls message={message} thread={thread} />
    </>
  );
}

function MessageContent({ children, isLoading }) {
  // 流式传输时启用字符动画
  const rehypePlugins = isLoading ? [rehypeSplitWordsIntoSpans] : [];

  if (typeof children === "object" && children.type === "text") {
    return (
      <ConversationMessageResponse rehypePlugins={rehypePlugins}>
        {children.text}
      </ConversationMessageResponse>
    );
  }

  if (typeof children === "object" && children.type === "image_url") {
    return <img src={children.image_url} alt="Image" />;
  }

  return (
    <ConversationMessageResponse rehypePlugins={rehypePlugins}>
      {children}
    </ConversationMessageResponse>
  );
}
```

**工具调用渲染：**

```typescript
function ToolCalls({ message, thread }) {
  if (!hasToolCalls(message)) return null;

  return (
    <div className="flex flex-col gap-4">
      {message.tool_calls.map((tool_call) => (
        <ToolCallView
          key={tool_call.id}
          toolCall={tool_call}
          messages={thread.messages}
        />
      ))}
    </div>
  );
}

// src/components/tool-call-view.tsx
export function ToolCallView({ toolCall, messages }) {
  // 查找对应的 ToolMessage
  const toolMessage = messages.find(
    (m) => m.type === "tool" && m.tool_call_id === toolCall.id
  );

  return (
    <Card>
      <CardHeader>
        <Tool className="h-4 w-4" />
        <span>{toolCall.name}</span>
      </CardHeader>
      <CardContent>
        {/* 工具参数 */}
        <CodeBlock language="json">
          {JSON.stringify(toolCall.args, null, 2)}
        </CodeBlock>

        {/* 工具结果 */}
        {toolMessage && (
          <div>
            <h4>Result:</h4>
            <CodeBlock>{toolMessage.content}</CodeBlock>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 数据缓存与同步链路

### 8. TanStack Query 缓存机制

**缓存架构：**

```
┌──────────────────────────────────────────────────────┐
│            TanStack Query Client                      │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Query Cache                                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ ["threads", "search", { limit: 50, ... }]     │ │
│  │   - data: Thread[]                             │ │
│  │   - status: "success" | "loading" | "error"    │ │
│  │   - dataUpdatedAt: 1703001234567               │ │
│  │   - staleTime: 300000 (5 minutes)              │ │
│  │   - gcTime: 900000 (15 minutes)                │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │ ["assistants", "search", { limit: 50, ... }]  │ │
│  │   - data: Assistant[]                          │ │
│  │   - status: "success"                          │ │
│  │   - dataUpdatedAt: 1703001234567               │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  Mutation Cache                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ deleteThread                                   │ │
│  │   - status: "idle" | "pending" | "success"     │ │
│  │   - variables: { threadId: "thread-123" }      │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**查询键（Query Key）策略：**

```typescript
// 列表查询
["threads", "search", { limit: 50, sortBy: "updated_at", sortOrder: "desc" }]
["assistants", "search", { limit: 50, sortBy: "name", sortOrder: "asc" }]

// 详情查询
["thread", threadId]
["assistant", assistantId]

// 为什么这样设计？
// 1. 层次化：["entity", "operation", params]
// 2. 可预测：相同参数 = 相同 key = 命中缓存
// 3. 易于失效：invalidate ["threads"] 会失效所有 threads 查询
```

**缓存生命周期：**

```typescript
// QueryClient 配置 (src/app/workspace/layout.tsx)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 分钟后标记为过期
      gcTime: 15 * 60 * 1000,         // 15 分钟后垃圾回收
      refetchOnWindowFocus: false,   // 窗口聚焦时不自动重新获取
      retry: 1,                       // 失败后重试 1 次
    },
  },
});

// 时间线示例：
// t=0:00  - 首次获取 threads 列表
// t=0:30  - 再次使用 useThreads() → 命中缓存，直接返回
// t=5:00  - 数据标记为 stale（过期）
// t=5:01  - 再次使用 useThreads() → 返回缓存数据，同时后台重新获取
// t=15:00 - 如果没有组件使用该查询，缓存被垃圾回收
```

**缓存失效策略：**

```typescript
// 场景 1: 创建新 thread 后，失效 threads 列表
const handleCreateThread = async () => {
  await createThread(data);

  // 失效所有 threads 查询，触发重新获取
  queryClient.invalidateQueries({ queryKey: ["threads"] });
};

// 场景 2: 删除 thread 时，乐观更新缓存
const deleteThread = useMutation({
  mutationFn: ({ threadId }) => apiClient.threads.delete(threadId),

  onSuccess(_, { threadId }) {
    // 立即更新缓存，不等服务器确认
    queryClient.setQueriesData(
      { queryKey: ["threads", "search"], exact: false },
      (oldData) => oldData.filter(t => t.thread_id !== threadId),
    );
  },
});

// 场景 3: 发送消息后，刷新 threads 列表（更新 updated_at）
await thread.submit(message);
queryClient.invalidateQueries({ queryKey: ["threads", "search"] });
```

**多标签页同步（可选功能）：**

```typescript
// 使用 BroadcastChannel API 同步多个标签页的缓存
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 启用多标签页同步
      refetchOnWindowFocus: true,
    },
  },
});

// 当用户切换回标签页时，自动重新获取数据
// 确保多个标签页的数据保持一致
```

---

## 总结

### 核心链路关键点

1. **应用启动**
   - Root Layout → Workspace Layout → Thread Page
   - 单例 QueryClient 和 LangGraph Client

2. **消息流转**
   - InputBox → ThreadPage.handleSubmit → thread.submit
   - 乐观更新 → WebSocket 流式传输 → UI 实时更新

3. **实时流式传输**
   - WebSocket/SSE 连接
   - 事件驱动更新（token, message, tool_call, end）
   - useStream Hook 自动管理状态

4. **状态管理**
   - Server State (TanStack Query) - 列表、详情
   - Streaming State (useStream) - 实时消息
   - UI State (React) - 本地交互
   - URL State (Router) - 可分享的状态
   - Local Storage - 持久化偏好

5. **数据缓存**
   - 层次化 Query Key
   - 5 分钟 stale time，15 分钟 gc time
   - 乐观更新提升用户体验
   - 智能失效策略

### 性能优化要点

1. **减少不必要的重新渲染**
   - 使用 `useMemo` 缓存计算结果
   - 使用 `useCallback` 缓存回调函数
   - React.memo 包装纯组件

2. **高效的数据获取**
   - TanStack Query 自动去重请求
   - 后台自动重新验证
   - 智能缓存策略

3. **流式传输优化**
   - 增量更新 UI，不等完整响应
   - 自动滚动到底部
   - 流式传输时的字符动画

4. **代码分割**
   - Next.js 自动代码分割
   - 动态导入重组件
   - 路由级别的懒加载

### 关键文件索引

| 文件路径 | 职责 | 核心功能 |
|---------|------|---------|
| `src/lib/api/client.ts` | API 客户端 | LangGraph 客户端单例 |
| `src/lib/api/hooks.ts` | 数据钩子 | useThreads, useAssistants, useDeleteThread |
| `src/app/workspace/layout.tsx` | 工作区布局 | QueryClient 初始化 |
| `src/app/workspace/threads/[threadId]/page.tsx` | Thread 页面 | useStream, 消息提交, Todo 提取 |
| `src/components/messages.tsx` | 消息列表 | 消息渲染, 工具栏, 分支切换 |
| `src/components/input-box.tsx` | 输入框 | 用户输入, 提交/停止 |
| `src/components/tool-call-view.tsx` | 工具调用 | 工具参数和结果展示 |
