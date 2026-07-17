// importing firebase stuff from the web
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// DO NOT TOUCH THIS CONFIG - setting up my database
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
const db = getFirestore(app);

// -----------------------------
// QUIZ SECTION LOGIC
// -----------------------------
document.getElementById('footprintForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // don't reload the page on submit pls

    // get all the answers from the dropdowns
    let a1 = parseInt(document.getElementById("q1").value) || 0;
    let a2 = parseInt(document.getElementById("q2").value) || 0;
    let a3 = parseInt(document.getElementById("q3").value) || 0;
    let a4 = parseInt(document.getElementById("q4").value) || 0;
    let a5 = parseInt(document.getElementById("q5").value) || 0;
    
    let finalScore = a1 + a2 + a3 + a4 + a5;

    // save score to the cloud secretly
    try {
        await addDoc(collection(db, 'simulatorScores'), {
            score: finalScore,
            date: new Date().toString()
        });
    } catch (e) {
        console.log("bruh firebase error: ", e);
    }

    let feedbackMsg = document.getElementById("feedbackText");
    let faceEmoji = "";
    let colorHex = "";

    // update the ui colors and text based on how well they did
    if (finalScore >= 80) {
        faceEmoji = "🌍🏆";
        colorHex = "green"; 
        feedbackMsg.innerText = "🔥 INCREDIBLE! You implemented a true sustainable framework. By shifting to renewables and enforcing a circular economy, we can reach Net-Zero!";
        feedbackMsg.style.color = "green"; 
    } else if (finalScore >= 40 && finalScore < 80) {
        faceEmoji = "⚠️📉";
        colorHex = "orange"; 
        feedbackMsg.innerText = "🌱 A GOOD START. But half-measures like EVs aren't enough. We need systemic shifts in agriculture and public transit. Try again!";
        feedbackMsg.style.color = "orange"; 
    } else {
        faceEmoji = "🏭❌";
        colorHex = "red"; 
        feedbackMsg.innerText = "🚨 DISASTER. Continuing the status quo guarantees severe global warming. We need radical policy shifts immediately.";
        feedbackMsg.style.color = "red"; 
    }

    document.getElementById("resultEmoji").innerText = faceEmoji;
    document.getElementById('footprintForm').style.display = 'none'; // hide quiz
    document.getElementById("resultBox").style.display = "block"; // show results

    // cool little counting animation I found online
    let counter = 0;
    document.getElementById("scoreText").innerText = "0"; 
    
    let timerThing = setInterval(() => {
        if (counter >= finalScore) {
            clearInterval(timerThing);
            document.getElementById("scoreText").innerText = finalScore; 
        } else {
            counter++;
            document.getElementById("scoreText").innerText = counter;
        }
    }, 20); 

    // animate the bar filling up
    setTimeout(() => {
        document.getElementById("barFill").style.width = finalScore + "%";
        document.getElementById("barFill").style.backgroundColor = colorHex;
    }, 150);
});


// -----------------------------
// LIVE BOARD LOGIC
// -----------------------------
const boardDB = collection(db, "listedItems");
const myQuery = query(boardDB, orderBy("timestamp", "desc"));

// this updates the board instantly when someone posts without needing to refresh
onSnapshot(myQuery, (snap) => {
    let boardDiv = document.getElementById('live-board');
    boardDiv.innerHTML = ""; // clear old data first
    
    let itemsCount = 0; 

    snap.forEach((docData) => {
        let item = docData.data();
        let itemId = docData.id; 

        // if someone already took it, just skip rendering it
        if (item.status === "claimed") {
            return; 
        }

        itemsCount++; 

        // build the html for the item card
        let cardHTML = `
            <div class="item-card" id="card-${itemId}">
                <div class="card-icon">${item.icon}</div>
                <h3>${item.name}</h3>
                <p class="lister-name">Listed by: ${item.lister}</p>
                <p>${item.description}</p>
                <button class="grab-btn" id="btn-${itemId}" onclick="claimIt('${itemId}')">CLAIM FOR FREE</button>
            </div>
        `;
        boardDiv.innerHTML += cardHTML;
    });
    
    if (itemsCount == 0) {
        boardDiv.innerHTML = "<h3 style='width:100%; text-align:center; color:gray;'>No items available right now. Be the first to list something! ♻️</h3>";
    }
});


// when someone submits the new item form
document.getElementById('addItemForm').addEventListener('submit', async function(ev) {
    ev.preventDefault(); 

    let submitBtn = document.querySelector(".post-btn") || document.querySelector("button[type='submit']");
    let originalText = submitBtn.innerText;
    submitBtn.innerText = "UPLOADING... ⏳";
    
    try {
        await addDoc(collection(db, "listedItems"), {
            name: document.getElementById('newItemName').value,
            icon: document.getElementById('newItemIcon').value,
            lister: document.getElementById('newListerName').value,
            description: document.getElementById('newItemDesc').value,
            status: "available",
            timestamp: new Date().toISOString()
        });

        alert("📦 It's live on the board!");
        document.getElementById('addItemForm').reset();

    } catch (err) {
        console.log("error saving item: ", err);
        alert("Oops, network error.");
    } 
    
    submitBtn.innerText = originalText;
});


// putting this on window so the inline html onclick can actually see it lol
window.claimIt = async function(id) {
    let username = prompt("♻️ Awesome! Enter your name & class so the owner knows who to give it to:");

    // if they cancel the prompt just stop
    if (!username || username.trim() == "") {
        return; 
    }

    let theCard = document.getElementById("card-" + id);
    let theBtn = document.getElementById("btn-" + id);

    // fake the ui update first so it feels super fast to the user
    if(theBtn) {
        theBtn.innerText = "🎉 CLAIMED BY " + username.toUpperCase() + "!";
        theBtn.style.background = "green"; 
        theBtn.style.color = "white";
        theBtn.disabled = true;
    }

    if(theCard) {
        theCard.style.borderColor = "green";
    }

    // wait a second then actually update database
    setTimeout(async () => {
        
        if (theCard) {
            theCard.style.opacity = "0.3"; // fade it out a bit
        }

        try {
            // update firebase
            let docRef = doc(db, "listedItems", id);
            await updateDoc(docRef, {
                status: "claimed",
                claimedBy: username
            });
            
        } catch (err) {
            console.log("firebase claim error: ", err);
            alert("🚨 ERROR: Couldn't connect to server!");
            
            // if it failed, put the button back to normal
            if(theBtn) {
                theBtn.innerText = "CLAIM FOR FREE";
                theBtn.style.background = "";
                theBtn.style.color = "black";
                theBtn.disabled = false;
            }
            if(theCard) {
                theCard.style.borderColor = "black";
                theCard.style.opacity = "1";
            }
        }

    }, 800); 
};


// function for the try again button
window.resetQuiz = function() {
    document.getElementById("footprintForm").reset();
    document.getElementById("scoreText").innerText = "0";
    document.getElementById("barFill").style.width = "0%";
    document.getElementById("resultBox").style.display = "none";
    document.getElementById("footprintForm").style.display = "block";
    
    // scroll back up to the top of the quiz
    window.scrollTo(0, document.getElementById('sim').offsetTop);
};
