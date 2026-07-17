// ==========================================
// SDG WEBATHON - FULL STACK JAVASCRIPT LOGIC
// Update: Added ability to list YOUR OWN items dynamically to the DOM and DB!
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBNO8SiOBW49CqL7YgHd572pF9mikE7ABo",
    authDomain: "ecofootprint-9c4ed.firebaseapp.com",
    projectId: "ecofootprint-9c4ed",
    storageBucket: "ecofootprint-9c4ed.firebasestorage.app",
    messagingSenderId: "425267033599",
    appId: "1:425267033599:web:3554770c24a204594ba3ca",
    measurementId: "G-NCNFZTHKS4"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

console.log("%c🌿 TEAM CODEGREENS FULL STACK CONNECTED! ☁️", "color: #2ecc71; font-size: 20px; font-weight: bold;");

// ==========================================
// 1. POLICY SIMULATOR LOGIC
// ==========================================
document.getElementById('footprintForm').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    let q1 = Number(document.getElementById("q1").value);
    let q2 = Number(document.getElementById("q2").value);
    let q3 = Number(document.getElementById("q3").value);
    let q4 = Number(document.getElementById("q4").value);
    let q5 = Number(document.getElementById("q5").value);
    let totalScore = q1 + q2 + q3 + q4 + q5;

    try {
        await addDoc(collection(db, "simulatorScores"), {
            score: totalScore,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("Database error bro: ", e);
    }

    let scoreDisplay = document.getElementById("scoreDisplay");
    let feedbackText = document.getElementById("feedbackText");
    let resultBox = document.getElementById("resultBox");
    let resultEmoji = document.getElementById("resultEmoji");
    let scoreBarFill = document.getElementById("scoreBarFill");

    let emoji = "";
    let barColor = "";

    if (totalScore >= 80) {
        emoji = "🌍🏆";
        barColor = "#2ecc71"; 
        feedbackText.innerHTML = "🔥 INCREDIBLE! You implemented a true sustainable framework. By shifting to renewables, protecting natural carbon sinks, and enforcing a circular economy, we can actually reach Net-Zero by 2050!";
        feedbackText.style.color = "#27ae60"; 
    } else if (totalScore >= 40 && totalScore < 80) {
        emoji = "⚠️📉";
        barColor = "#ffeb3b"; 
        feedbackText.innerHTML = "🌱 A GOOD START. Half-measures like EVs and recycling are helpful, but without systemic shifts in agriculture, public transit, and ending fossil fuels, we will still miss our climate targets. Try again!";
        feedbackText.style.color = "#d35400"; 
    } else {
        emoji = "🏭❌";
        barColor = "#ff5252"; 
        feedbackText.innerHTML = "🚨 DISASTER. Continuing the status quo guarantees severe global warming. We need radical policy shifts immediately.";
        feedbackText.style.color = "#c0392b"; 
    }

    resultEmoji.innerHTML = emoji;
    document.getElementById('footprintForm').style.display = 'none';
    resultBox.style.display = "block";

    let currentCount = 0;
    scoreDisplay.innerHTML = "0"; 
    
    let counterInterval = setInterval(() => {
        if (currentCount >= totalScore) {
            clearInterval(counterInterval);
            scoreDisplay.innerHTML = totalScore; 
        } else {
            currentCount += 1;
            scoreDisplay.innerHTML = currentCount;
        }
    }, 20); 

    setTimeout(() => {
        scoreBarFill.style.width = totalScore + "%";
        scoreBarFill.style.backgroundColor = barColor;
    }, 100);
});

// ==========================================
// 2. THE GIVE & TAKE BOARD LOGIC
// ==========================================

// A. LIST A NEW ITEM
document.getElementById('addItemForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Stop page reload

    // Grab values from the new form
    let itemName = document.getElementById('newItemName').value;
    let itemIcon = document.getElementById('newItemIcon').value;
    let listerName = document.getElementById('newListerName').value;
    let itemDesc = document.getElementById('newItemDesc').value;
    
    // Generate a unique ID using the current time
    let uniqueId = "item-" + Date.now();

    try {
        // Push the new item to Firebase
        await addDoc(collection(db, "listedItems"), {
            id: uniqueId,
            name: itemName,
            icon: itemIcon,
            lister: listerName,
            description: itemDesc,
            status: "available",
            timestamp: new Date().toISOString()
        });

        alert("📦 Item listed successfully in the cloud! Thanks for reducing waste.");

        // Bro, this is dynamic DOM manipulation. We build the HTML card from JS!
        let newCardHTML = `
            <div class="item-card" id="card-${uniqueId}">
                <div class="card-icon">${itemIcon}</div>
                <h3>${itemName}</h3>
                <p class="item-lister">Listed by: ${listerName}</p>
                <p>${itemDesc}</p>
                <button class="claim-btn" id="btn-${uniqueId}" onclick="claimItem('${uniqueId}')">CLAIM FOR FREE</button>
            </div>
        `;

        // Inject the new card at the very beginning of our container
        document.getElementById('give-take-cards').insertAdjacentHTML('afterbegin', newCardHTML);

        // Clear the form for the next item
        document.getElementById('addItemForm').reset();

    } catch (e) {
        console.error("Failed to list item: ", e);
        alert("Error connecting to database. Please try again.");
    }
});

// B. CLAIM AN ITEM
async function claimItem(itemId) {
    let btn = document.getElementById("btn-" + itemId);
    
    btn.innerHTML = "CLAIMING... ⏳";
    btn.disabled = true;

    try {
        await addDoc(collection(db, "claimedItems"), {
            itemClaimed: itemId,
            status: "claimed",
            timestamp: new Date().toISOString()
        });

        alert("♻️ Circular Economy WIN! Claim recorded. Go meet them to pick it up!");

        btn.innerHTML = "CLAIMED ❌";
        document.getElementById("card-" + itemId).style.borderColor = "#9e9e9e";
        document.getElementById("card-" + itemId).style.boxShadow = "none";

    } catch (e) {
        console.error("Failed to claim item:", e);
        alert("Database error! Could not claim.");
        btn.innerHTML = "CLAIM FOR FREE";
        btn.disabled = false;
    }
}

function resetQuiz() {
    document.getElementById("footprintForm").reset();
    document.getElementById("scoreDisplay").innerHTML = "0";
    document.getElementById("scoreBarFill").style.width = "0%";
    document.getElementById("resultBox").style.display = "none";
    document.getElementById("footprintForm").style.display = "block";
    document.getElementById('quiz').scrollIntoView({ behavior: 'smooth' });
}

// ⚠️ We still need to attach these to window so HTML onClick works!
window.claimItem = claimItem;
window.resetQuiz = resetQuiz;
