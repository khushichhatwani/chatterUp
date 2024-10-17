// client/script.js
const socket = io.connect('http://localhost:5000')

const notificationPanel = document.getElementById('notification-panel');
const messageContainer = document.getElementById('message-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const onlineUserList = document.getElementById('online-user');

let userName = null;
while (!userName) {
    userName = prompt("Enter your name:");
    if (userName === null || userName.trim() === "") {
        alert("Name cannot be empty. Please enter a valid name.");
    }
}

socket.emit('join', userName);

// Load previous messages
socket.on('loadMessages', (previousMessages) => {

  previousMessages.forEach(data => {
         const messageClass = data.user === userName ? 'user-message' : 'other-message';
  const time= "message-time"
        messageContainer.innerHTML += `<div class="${messageClass}" ><strong>${data.user}:</strong> ${data.message} <small class="${time}">${new Date(data.timestamp).toLocaleTimeString()}</small></div>`;
    });
    messageContainer.scrollTop = messageContainer.scrollHeight; // Scroll to bottom
});


socket.on('notification', (message) => {
    notificationPanel.innerHTML += `<div>${message}</div>`;
});
const notificationSound = new Audio('simple-notification-152054.mp3');


socket.on('receiveMessage', (data) => {
  const messageClass = data.user === userName ? 'user-message' : 'other-message';
  const time= "message-time"

    messageContainer.innerHTML += `<div class="${messageClass}" ><strong>${data.user}:</strong> ${data.message} <small class="${time}">${new Date(data.timestamp).toLocaleTimeString()}</small></div>`;
  messageContainer.scrollTop = messageContainer.scrollHeight; // Scroll to bottom
   // Play the notification sound
    if (data.user !== userName) { // Only play sound if the message is from another user
        notificationSound.play();
    }
});


const sendMessage = () => {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('sendMessage', { user: userName, message });
    messageInput.value = ''; // Clear input
  }
};

// Send message on button click
sendButton.addEventListener('click', sendMessage);

// Send message on 'Enter' key press
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Update user count display
socket.on('updateUserCount', (count) => {
    notificationPanel.innerHTML += `<div>${count} user(s) online</div>`;
});
// Update online users display
socket.on('onlineUser', (users) => {
    console.log("online users",users);
    users.forEach((user) => {
        onlineUserList.innerHTML += `<div><p>${user.name}</p></div>`;
    });
});

