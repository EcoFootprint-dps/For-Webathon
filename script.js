/* 
    DEVS: Kunal and Meenakshi 
    STATUS: Powered by energy drinks and stress 
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyBNO8SiOBW49CqL7YgHd572pF9mikE7ABo", authDomain: "ecofootprint-9c4ed.firebaseapp.com", projectId: "ecofootprint-9c4ed", storageBucket: "ecofootprint-9c4ed.firebasestorage.app", messagingSenderId: "425267033599", appId: "1:425267033599:web:3554770c24a204594ba3ca", measurementId: "G-NCNFZTHKS4" }; 

const app = initializeApp(firebaseConfig); 
const db = getFirestore(app);

const sanitizeHTML = (str) => { if (!str) return ""; let temp = document.createElement('div'); temp.textContent = str; return temp.innerHTML; };

/* Quiz Logic */
document.getElementById('footprintForm').addEventListener('submit', async function(event) { 
    event.preventDefault(); 
    
    let q1 = parseInt(document.getElementById("q1").value, 10) || 0; 
    let q2 = parseInt(document.getElementById("q2").value, 10) || 0; 
    let q3 = parseInt(document.getElementById("q3").value, 10) || 0; 
    let q4 = parseInt(document.getElementById("q4").value, 10) || 0; 
    let q5 = parseInt(document.getElementById("q5").value, 10) || 0; 
    let totalScore = q1 + q2 + q3 + q4 + q5;

    addDoc(collection(db, 'simulatorScores'), { score: totalScore, date: serverTimestamp() }).catch(error => { console.log("Firebase error: ", error); }); 

    let feedbackTextElement = document.getElementById("feedbackText"); let feedbackEmoji = ""; let barColor = "";

    if (totalScore >= 80) { feedbackEmoji = "🌍"; barColor = "green"; feedbackTextElement.innerText = "🔥 INCREDIBLE! You implemented a true sustainable framework."; feedbackTextElement.style.color = "green"; } 
    else if (totalScore >= 40 && totalScore < 80) { feedbackEmoji = "⚠️"; barColor = "orange"; feedbackTextElement.innerText = "🌱 A GOOD START. But half-measures aren't enough."; feedbackTextElement.style.color = "orange"; } 
    else { feedbackEmoji = "❌"; barColor = "red"; feedbackTextElement.innerText = "🚨 DISASTER. Continuing the status quo guarantees severe global warming."; feedbackTextElement.style.color = "red"; }

    document.getElementById("resultEmoji").innerText = feedbackEmoji; 
    document.getElementById('footprintForm').style.display = 'none'; 
    document.getElementById("resultBox").style.display = "block";
    let currentScore = 0; document.getElementById("scoreText").innerText = "0";

    let scoreCounter = setInterval(function() { if (currentScore >= totalScore) { clearInterval(scoreCounter); document.getElementById("scoreText").innerText = totalScore; } else { currentScore++; document.getElementById("scoreText").innerText = currentScore; } }, 20); 
    setTimeout(() => { document.getElementById("barFill").style.width = totalScore + "%"; document.getElementById("barFill").style.backgroundColor = barColor; }, 150); 
});

/* Give & Take Board Logic */
const boardCollection = collection(db, "listedItems"); 
const boardQuery = query(boardCollection, orderBy("timestamp", "desc")); 

onSnapshot(boardQuery, (snapshot) => { 
    let liveBoard = document.getElementById('live-board'); 
    let claimedList = document.getElementById('claimed-list'); 
    liveBoard.innerHTML = ""; 
    claimedList.innerHTML = "";
    let itemCount = 0; let claimedCount = 0;

    snapshot.forEach((docSnap) => {
        let itemData = docSnap.data(); let itemId = docSnap.id;
        let safeName = sanitizeHTML(itemData.name); 
        let safeClaimedBy = sanitizeHTML(itemData.claimedBy); 
        let safeLister = sanitizeHTML(itemData.lister); 
        let safeDesc = sanitizeHTML(itemData.description);

        if (itemData.status === "claimed") { claimedCount++; claimedList.innerHTML += `<li>✅ <strong>${safeName}</strong> was snagged by ${safeClaimedBy}!</li>`; } 
        else { itemCount++; let htmlCard = `<div class="item-card" id="card-${itemId}"><div class="card-icon">${itemData.icon}</div><h3>${safeName}</h3><p class="lister-name">Listed by: ${safeLister}</p><p>${safeDesc}</p><button class="grab-btn" id="btn-${itemId}" onclick="claimIt('${itemId}')">CLAIM FOR FREE</button></div>`; liveBoard.innerHTML += htmlCard; }
    });

    if (itemCount === 0) { liveBoard.innerHTML = "<h3 style='width:100%;text-align:center;color:gray;'>Empty board... sadge. Be the first to list!</h3>"; } 
    if (claimedCount === 0) { claimedList.innerHTML = "<li>No items claimed yet... be the first!</li>"; }
});

document.getElementById('addItemForm').addEventListener('submit', async(event) => { 
    event.preventDefault(); let submitBtn = document.querySelector(".post-btn"); let originalText = submitBtn.innerText; submitBtn.innerText = "UPLOADING..."; 
    addDoc(collection(db, "listedItems"), { name: document.getElementById('newItemName').value, icon: document.getElementById('newItemIcon').value, lister: document.getElementById('newListerName').value, description: document.getElementById('newItemDesc').value, status: "available", timestamp: serverTimestamp() }).then(() => { alert("Live!"); document.getElementById('addItemForm').reset(); submitBtn.innerText = originalText; }).catch((error) => { console.log(error); alert("Network error."); submitBtn.innerText = originalText; });
});

window.claimIt = function(itemId) { 
    let userName = prompt("♻️ Enter your name & class:");
    if (!userName || userName.trim() === "") { return; } 
    let btn = document.getElementById("btn-" + itemId);
    if (btn) { btn.innerText = "CLAIMED!"; btn.style.background = "green"; btn.disabled = true; } 
    setTimeout(function() { 
        updateDoc(doc(db, "listedItems", itemId), { status: "claimed", claimedBy: userName }).catch((error) => { console.log("err: " + error); alert("Error!"); if (btn) { btn.innerText = "CLAIM FOR FREE"; btn.style.background = ""; btn.disabled = false; } }); 
    }, 800);
};

window.resetQuiz = () => { 
    document.getElementById("footprintForm").reset(); 
    document.getElementById("scoreText").innerText = "0"; 
    document.getElementById("barFill").style.width = "0%"; 
    document.getElementById("resultBox").style.display = "none"; 
    document.getElementById("footprintForm").style.display = "block"; 
    window.scrollTo(0, document.getElementById('sim').offsetTop); 
};

/* SYSTEM OVERRIDE SEQUENCE */
window.activateWinnerProtocol = async () => {
    let terminal = document.createElement('div');
    terminal.className = 'terminal-overlay';
    terminal.innerHTML = '<div class="typing">SYSTEM OVERRIDE: WINNERS GRANTED...</div>';
    document.body.appendChild(terminal);

    await new Promise(r => setTimeout(r, 2500));
    terminal.remove();

    document.body.classList.add('shake');
    document.body.classList.add('winner-mode');
    
    for(let i = 0; i < 80; i++) {
        let c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.backgroundColor = ['#2ecc71', '#ff5722', '#ffd700'][Math.floor(Math.random() * 3)];
        c.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(c);
    }
    
    let banner = document.createElement('div');
    banner.className = 'victory-banner';
    banner.innerHTML = '<h1 style="font-size: 8rem; color: white; text-shadow: 10px 10px 0px black; font-family: sans-serif; letter-spacing: -5px;">WINNERS! 🏆</h1>';
    document.body.appendChild(banner);
    
    setTimeout(() => {
        document.body.classList.remove('shake');
        document.body.classList.remove('winner-mode');
        banner.remove();
        document.querySelectorAll('.confetti').forEach(e => e.remove());
    }, 4000);
};
