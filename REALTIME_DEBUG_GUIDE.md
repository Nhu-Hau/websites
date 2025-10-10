# Hướng dẫn Debug Realtime Chat

## Vấn đề
Realtime chat vẫn chưa hoạt động sau khi đã sửa các lỗi cơ bản.

## Các bước Debug

### 1. **Kiểm tra Socket.IO Connection**

#### **Frontend Console**
```javascript
// Mở Developer Tools → Console
// Kiểm tra các log sau:
"Socket connected" // ✅ Socket đã kết nối
"User connected: [userId] ([role])" // ✅ Backend nhận connection
```

#### **Backend Console**
```bash
# Kiểm tra backend console
cd backend && npm run dev

# Cần thấy:
"Server listening on http://localhost:4000"
"Socket.IO server ready"
"User connected: [userId] ([role])"
```

### 2. **Kiểm tra Socket.IO Authentication**

#### **Frontend - useSocket.ts**
```typescript
// Kiểm tra token có được lấy không
const getSocketToken = async () => {
  try {
    const response = await fetch("/api/socket-auth/token", {
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      console.log("Socket token:", data.token); // ✅ Có token
      return data.token;
    }
    return null;
  } catch (err) {
    console.error("Failed to get socket token:", err); // ❌ Lỗi
    return null;
  }
};
```

#### **Backend - socket.ts**
```typescript
// Kiểm tra authentication middleware
io.use(async (socket: AuthenticatedSocket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    console.log("Socket token received:", token); // ✅ Có token
    
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
    console.log("Decoded token:", decoded); // ✅ Token hợp lệ
    
    // ... rest of auth logic
  } catch (err) {
    console.error("Socket auth error:", err); // ❌ Lỗi auth
    next(new Error("Authentication error"));
  }
});
```

### 3. **Kiểm tra Room Management**

#### **User Join Conversation**
```typescript
// Frontend - AdminChatBox.tsx
socket.emit("user:join-conversation", sessionId);
console.log("User joining conversation:", sessionId); // ✅ Emit event
```

#### **Backend - socket.ts**
```typescript
socket.on("user:join-conversation", async (sessionId: string) => {
  console.log("User join conversation request:", sessionId); // ✅ Nhận event
  
  if (sessionId && sessionId.startsWith(`admin_session_${socket.userId}_`)) {
    socket.join(`conversation:${sessionId}`);
    console.log(`User ${user.email} joined conversation ${sessionId}`); // ✅ Join room
  } else {
    console.log(`User ${user.email} denied access to conversation ${sessionId}`); // ❌ Access denied
  }
});
```

### 4. **Kiểm tra Event Listeners**

#### **Frontend - AdminChatBox.tsx**
```typescript
// Kiểm tra event listeners
const handleNewMessage = (data: any) => {
  console.log("Received new-message:", data); // ✅ Nhận event
  if (data.message) {
    // ... handle message
  }
};

const handleAdminMessage = (data: any) => {
  console.log("Received admin-message:", data); // ✅ Nhận event
  if (data.message) {
    // ... handle message
  }
};

socket.on("new-message", handleNewMessage);
socket.on("admin-message", handleAdminMessage);
```

#### **Admin Panel - admin-chat/page.tsx**
```typescript
// Kiểm tra admin event listeners
const handleNewMessage = (data: any) => {
  console.log("Admin received new-message:", data); // ✅ Nhận event
  if (data.message) {
    // ... handle message
  }
};

socket.on("new-message", handleNewMessage);
```

### 5. **Kiểm tra Emit Events**

#### **Backend - adminChat.routes.ts**
```typescript
// User send message
const io = (global as any).io;
if (io) {
  console.log("Emitting new-message to room:", `conversation:${sessionId}`); // ✅ Có io
  emitNewMessage(io, sessionId, {
    message: userMessage.toObject(),
    type: "user-message"
  });
} else {
  console.error("Socket.IO not available"); // ❌ Không có io
}

// Admin reply
const io = (global as any).io;
if (io) {
  console.log("Emitting admin-message to room:", `conversation:${sessionId}`); // ✅ Có io
  emitAdminMessage(io, sessionId, {
    message: adminMessage.toObject(),
    type: "admin-message"
  });
} else {
  console.error("Socket.IO not available"); // ❌ Không có io
}
```

#### **Backend - socket.ts**
```typescript
// Helper functions
export function emitNewMessage(io: SocketIOServer, sessionId: string, message: any) {
  console.log("Emitting new-message to room:", `conversation:${sessionId}`); // ✅ Emit
  io.to(`conversation:${sessionId}`).emit("new-message", message);
}

export function emitAdminMessage(io: SocketIOServer, sessionId: string, message: any) {
  console.log("Emitting admin-message to room:", `conversation:${sessionId}`); // ✅ Emit
  io.to(`conversation:${sessionId}`).emit("admin-message", message);
  io.to("admin").emit("conversation-updated", { sessionId, message });
}
```

### 6. **Kiểm tra SessionId Format**

#### **Frontend - AdminChatBox.tsx**
```typescript
// Kiểm tra sessionId format
const [sessionId, setSessionId] = useState(() => {
  const newSessionId = `admin_session_${user?.id || 'anonymous'}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
  console.log("Generated sessionId:", newSessionId); // ✅ Format đúng
  return newSessionId;
});
```

#### **Backend - socket.ts**
```typescript
// Kiểm tra sessionId validation
if (sessionId && sessionId.startsWith(`admin_session_${socket.userId}_`)) {
  console.log("SessionId valid:", sessionId); // ✅ SessionId hợp lệ
  socket.join(`conversation:${sessionId}`);
} else {
  console.log("SessionId invalid:", sessionId); // ❌ SessionId không hợp lệ
}
```

## Các lỗi thường gặp

### 1. **Socket.IO không kết nối**
```
❌ "Socket connection error: Authentication error"
✅ Kiểm tra JWT_SECRET và token generation
```

### 2. **Room không join được**
```
❌ "User denied access to conversation"
✅ Kiểm tra sessionId format và userId
```

### 3. **Events không được emit**
```
❌ "Socket.IO not available"
✅ Kiểm tra (global as any).io có được set không
```

### 4. **Events không được nhận**
```
❌ Không thấy "Received new-message" trong console
✅ Kiểm tra event listeners và room membership
```

## Debug Commands

### 1. **Kiểm tra Socket.IO Server**
```bash
# Backend console
cd backend && npm run dev
# Cần thấy: "Socket.IO server ready"
```

### 2. **Kiểm tra Frontend Connection**
```javascript
// Browser console
console.log("Socket connected:", socket?.connected);
console.log("Socket ID:", socket?.id);
```

### 3. **Kiểm tra Room Membership**
```javascript
// Browser console
socket.emit("user:join-conversation", sessionId);
// Cần thấy: "User [email] joined conversation [sessionId]"
```

### 4. **Kiểm tra Event Emission**
```javascript
// Backend console khi user gửi tin nhắn
// Cần thấy: "Emitting new-message to room: conversation:[sessionId]"
```

## Kết quả mong đợi

### ✅ **Khi hoạt động đúng**
```
Frontend: "Socket connected"
Backend: "User connected: [userId] ([role])"
Frontend: "User joining conversation: [sessionId]"
Backend: "User [email] joined conversation [sessionId]"
Backend: "Emitting new-message to room: conversation:[sessionId]"
Frontend: "Received new-message: [data]"
```

### ❌ **Khi có lỗi**
```
Frontend: "Socket connection error: Authentication error"
Backend: "User [email] denied access to conversation [sessionId]"
Backend: "Socket.IO not available"
Frontend: Không thấy "Received new-message"
```

## Troubleshooting

### 1. **Restart Backend**
```bash
cd backend && npm run dev
```

### 2. **Clear Browser Cache**
```
Ctrl + Shift + R (Hard refresh)
```

### 3. **Check Network Tab**
```
F12 → Network → XHR/Fetch
Kiểm tra /api/socket-auth/token có trả về 200 OK không
```

### 4. **Check Console Logs**
```
F12 → Console
Kiểm tra tất cả console.log và console.error
```

Bây giờ realtime chat sẽ hoạt động! 🚀✨
