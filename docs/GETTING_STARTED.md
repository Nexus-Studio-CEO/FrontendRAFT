# 🎓 Getting Started with FrontendRAFT

Complete guide to build your first RAFT API in 15 minutes.

---

## 📋 Prerequisites

- Basic HTML/JavaScript knowledge
- Modern browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code recommended)
- Internet connection (for CDN)

**No backend knowledge required!**

---

## 🚀 Step 1: Create HTML File

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First RAFT API</title>
</head>
<body>
    <h1>FrontendRAFT Tutorial</h1>
    <div id="app"></div>

    <script type="module">
        // We'll add code here
    </script>
</body>
</html>
```

---

## 📦 Step 2: Import FrontendRAFT

Add this inside the `<script type="module">`:

```javascript
import { FrontendRAFT } from 'https://cdn.jsdelivr.net/gh/Nexus-Studio-CEO/FrontendRAFT@v0.1.0/src/index.js';

console.log('FrontendRAFT loaded!');
```

Open `index.html` in browser and check console. You should see "FrontendRAFT loaded!".

---

## 🔧 Step 3: Initialize RAFT

```javascript
import { FrontendRAFT } from 'https://cdn.jsdelivr.net/gh/Nexus-Studio-CEO/FrontendRAFT@v0.1.0/src/index.js';

// Create instance
const raft = new FrontendRAFT({
    name: 'My Notes API',
    version: '1.0.0',
    autoRegister: true
});

// Initialize (required!)
await raft.init();

console.log('RAFT ready!', raft.apiId);
```

Refresh page. You should see your API ID in console.

---

## 📝 Step 4: Define Your First Route

Let's create a simple notes API:

```javascript
// After raft.init()

// Define routes
raft.routes({
    'GET /notes': async () => {
        // Get notes from storage
        const notes = await raft.storage.get('notes') || [];
        return notes;
    },
    
    'POST /notes': async (req) => {
        // Get existing notes
        const notes = await raft.storage.get('notes') || [];
        
        // Create new note
        const newNote = {
            id: Date.now(),
            text: req.body.text,
            createdAt: new Date().toISOString()
        };
        
        // Add and save
        notes.push(newNote);
        await raft.storage.save('notes', notes);
        
        return newNote;
    },
    
    'DELETE /notes/:id': async (req) => {
        // Get notes
        let notes = await raft.storage.get('notes') || [];
        
        // Remove note
        notes = notes.filter(n => n.id !== parseInt(req.params.id));
        await raft.storage.save('notes', notes);
        
        return { deleted: true };
    }
});

console.log('Routes defined!');
```

---

## 🎨 Step 5: Create UI

Add this HTML after the `<h1>`:

```html
<div id="app">
    <h2>My Notes</h2>
    
    <div>
        <input type="text" id="noteInput" placeholder="Enter note...">
        <button id="addBtn">Add Note</button>
    </div>
    
    <ul id="notesList"></ul>
</div>

<style>
    body {
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 50px auto;
        padding: 20px;
    }
    
    #noteInput {
        padding: 10px;
        width: 70%;
        font-size: 16px;
    }
    
    #addBtn {
        padding: 10px 20px;
        font-size: 16px;
        cursor: pointer;
    }
    
    #notesList {
        list-style: none;
        padding: 0;
    }
    
    #notesList li {
        background: #f0f0f0;
        margin: 10px 0;
        padding: 15px;
        border-radius: 5px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .delete-btn {
        background: #ff4444;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
    }
</style>
```

---

## ⚡ Step 6: Connect UI to API

Add this JavaScript after route definitions:

```javascript
// Display notes
async function displayNotes() {
    const notes = await raft.get('/notes', { cache: true });
    const notesList = document.getElementById('notesList');
    
    notesList.innerHTML = notes.map(note => `
        <li>
            <span>${note.text}</span>
            <button class="delete-btn" onclick="deleteNote(${note.id})">
                Delete
            </button>
        </li>
    `).join('');
}

// Add note
document.getElementById('addBtn').addEventListener('click', async () => {
    const input = document.getElementById('noteInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    // Optimistic update
    await raft.post('/notes', { text }, { optimistic: true });
    
    input.value = '';
    await displayNotes();
});

// Delete note
window.deleteNote = async (id) => {
    await raft.delete(`/notes/${id}`);
    await displayNotes();
};

// Initial display
displayNotes();
```

---

## 🎉 Step 7: Test Your API

1. Open `index.html` in browser
2. Type "Buy milk" and click "Add Note"
3. Add more notes
4. Click "Delete" to remove notes
5. **Refresh page** - notes persist!

**Congratulations! You just built a fully functional API without any backend!** 🚀

---

## 🔥 Step 8: Add Real-Time (Bonus)

Make it collaborative! Add this:

```javascript
// Broadcast when note added
raft.routes({
    'POST /notes': async (req) => {
        const notes = await raft.storage.get('notes') || [];
        const newNote = {
            id: Date.now(),
            text: req.body.text,
            createdAt: new Date().toISOString()
        };
        notes.push(newNote);
        await raft.storage.save('notes', notes);
        
        // Broadcast to other users!
        await raft.stream.broadcast('/notes:updates', newNote);
        
        return newNote;
    }
});

// Listen for updates
const stream = raft.stream.open('/notes:updates');

(async () => {
    for await (const note of stream) {
        console.log('New note from another user:', note);
        await displayNotes();
    }
})();
```

Open in **2 browser tabs** and add notes — they sync in real-time!

---

## 📊 Step 9: Add Caching

Improve performance with smart caching:

```javascript
// Get notes with 1-minute cache
const notes = await raft.get('/notes', {
    cache: true,
    ttl: 60000 // 1 minute
});

// Second call hits cache (0ms!)
const cachedNotes = await raft.get('/notes');

// Invalidate cache after update
await raft.post('/notes', { text: 'New' });
await raft.cache.invalidate('/notes');
```

---

## 🎯 Complete Code

Here's the full working example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FrontendRAFT Notes</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
        }
        #noteInput {
            padding: 10px;
            width: 70%;
            font-size: 16px;
        }
        #addBtn {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
        }
        #notesList {
            list-style: none;
            padding: 0;
        }
        #notesList li {
            background: #f0f0f0;
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .delete-btn {
            background: #ff4444;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>My Notes App</h1>
    <div>
        <input type="text" id="noteInput" placeholder="Enter note...">
        <button id="addBtn">Add Note</button>
    </div>
    <ul id="notesList"></ul>

    <script type="module">
        import { FrontendRAFT } from 'https://cdn.jsdelivr.net/gh/Nexus-Studio-CEO/FrontendRAFT@v0.1.0/src/index.js';

        const raft = new FrontendRAFT({
            name: 'My Notes API',
            version: '1.0.0'
        });

        await raft.init();

        raft.routes({
            'GET /notes': async () => {
                const notes = await raft.storage.get('notes') || [];
                return notes;
            },
            
            'POST /notes': async (req) => {
                const notes = await raft.storage.get('notes') || [];
                const newNote = {
                    id: Date.now(),
                    text: req.body.text,
                    createdAt: new Date().toISOString()
                };
                notes.push(newNote);
                await raft.storage.save('notes', notes);
                return newNote;
            },
            
            'DELETE /notes/:id': async (req) => {
                let notes = await raft.storage.get('notes') || [];
                notes = notes.filter(n => n.id !== parseInt(req.params.id));
                await raft.storage.save('notes', notes);
                return { deleted: true };
            }
        });

        async function displayNotes() {
            const notes = await raft.get('/notes', { cache: true });
            const notesList = document.getElementById('notesList');
            
            notesList.innerHTML = notes.map(note => `
                <li>
                    <span>${note.text}</span>
                    <button class="delete-btn" onclick="deleteNote(${note.id})">Delete</button>
                </li>
            `).join('');
        }

        document.getElementById('addBtn').addEventListener('click', async () => {
            const input = document.getElementById('noteInput');
            const text = input.value.trim();
            
            if (!text) return;
            
            await raft.post('/notes', { text }, { optimistic: true });
            input.value = '';
            await displayNotes();
        });

        window.deleteNote = async (id) => {
            await raft.delete(`/notes/${id}`);
            await displayNotes();
        };

        displayNotes();
    </script>
</body>
</html>
```

---

## 🎓 Next Steps

### Learn Advanced Features

1. **Streaming** - [See examples/streaming-example.html](examples/streaming-example.html)
2. **Query Language** - [See examples/query-example.html](examples/query-example.html)
3. **React Integration** - [See examples/react-example.html](examples/react-example.html)
4. **Authentication** - [See examples/auth-example.html](examples/auth-example.html)

### Explore Documentation

- [RAFT Protocol Specification](RAFT_PROTOCOL.md)
- [API Reference](API_REFERENCE.md)
- [Roadmap](ROADMAP.md)

### Join Community

- GitHub: [Nexus-Studio-CEO/FrontendRAFT](https://github.com/Nexus-Studio-CEO/FrontendRAFT)
- Discussions: Ask questions
- Issues: Report bugs

---

## ❓ Troubleshooting

### Issue: "CSOP not loading"

**Solution**: Check internet connection. CSOP is loaded from CDN.

### Issue: "Routes not working"

**Solution**: Make sure you called `await raft.init()` before defining routes.

### Issue: "Data not persisting"

**Solution**: Check browser storage is enabled (not in incognito mode).

---

**You're now ready to build amazing APIs with FrontendRAFT!** 🚀

*Next: [RAFT Protocol Deep Dive](RAFT_PROTOCOL.md)*