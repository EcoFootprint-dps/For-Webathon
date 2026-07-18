// importing firebase stuff from the web - dont ask me how this works lol
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// DO NOT TOUCH THIS CONFIG - took me forever to copy paste this right
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
// QUIZ SECTION LOGIC - don't break this, it's fragile lol
// -----------------------------
document.getElementById('footprintForm').addEventListener('submit', async function(e) {
  e.preventDefault(); 
  let ans1 = parseInt(document.getElementById("q1").value, 10) || 0;
  let ans2 = parseInt(document.getElementById("q2").value, 10) || 0;
  let q3_val = parseInt(document.getElementById("q3").value, 10) || 0;
  let fourth = parseInt(document.getElementById("q4").value, 10) || 0;
  let a5 = parseInt(document.getElementById("q5").value, 10) || 0;
  let totalScore = ans1 + ans2 + q3_val + fourth + a5;
  
  try { await addDoc(collection(db, 'simulatorScores'), { score: totalScore, date: new Date().toString() }); } 
  catch (err) { console.log("bruh firebase error wtf: ", err); }
  
  let fMsg = document.getElementById("feedbackText");
  let face = ""; let cHex = "";
  
  if (totalScore >= 80) { face = "🌍🏆"; cHex = "green"; fMsg.innerText = "🔥 INCREDIBLE! You implemented a true sustainable framework. By shifting to renewables and enforcing a circular economy, we can reach Net-Zero!"; fMsg.style.color = "green"; } 
  else if (totalScore >= 40 && totalScore < 80) { face = "⚠️📉"; cHex = "orange"; fMsg.innerText = "🌱 A GOOD START. But half-measures like EVs aren't enough. We need systemic shifts in agriculture and public transit. Try again!"; fMsg.style.color = "orange"; } 
  else { face = "🏭❌"; cHex = "red"; fMsg.innerText = "🚨 DISASTER. Continuing the status quo guarantees severe global warming. We need radical policy shifts immediately."; fMsg.style.color = "red"; }
  
  document.getElementById("resultEmoji").innerText = face;
  document.getElementById('footprintForm').style.display = 'none'; 
  document.getElementById("resultBox").style.display = "block"; 
  
  let c = 0;
  document.getElementById("scoreText").innerText = "0"; 
  let ticker = setInterval(function() {
    if (c >= totalScore) { clearInterval(ticker); document.getElementById("scoreText").innerText = totalScore; } 
    else { c++; document.getElementById("scoreText").innerText = c; }
  }, 20); 
  
  setTimeout(() => { document.getElementById("barFill").style.width = totalScore + "%"; document.getElementById("barFill").style.backgroundColor = cHex; }, 150);
});

// -----------------------------
// LIVE BOARD & TRACKER LOGIC
// -----------------------------
const board = collection(db, "listedItems");
const myQ = query(board, orderBy("timestamp", "desc"));

onSnapshot(myQ, (snapshotThing) => {
  let b = document.getElementById('live-board');
  let cList = document.getElementById('claimed-list'); // the dropdown list we made
  b.innerHTML = ""; 
  cList.innerHTML = ""; // clear it so we don't duplicate stuff
  
  let count_items = 0; 
  let count_claimed = 0;

  snapshotThing.forEach((d) => {
    let itemData = d.data(); 
    let idString = d.id; 
    
    // Logic: If claimed, show in the dropdown. If not, show on the board.
    if (itemData.status === "claimed") {
      count_claimed++;
      cList.innerHTML += `<li>✅ <strong>${itemData.name}</strong> was snagged by${itemData.claimedBy}!</li>`;
    } else {
      count_items++; 
      let htmlCard = `<div class="item-card" id="card-${idString}">
                        <div class="card-icon">${itemData.icon}</div>
                        <h3>${itemData.name}</h3>
                        <p class="lister-name">Listed by: ${itemData.lister}</p>
                        <p>${itemData.description}</p>
                        <button class="grab-btn" id="btn-${idString}" onclick="claimIt('${idString}')">CLAIM FOR FREE</button>
                      </div>`;
      b.innerHTML += htmlCard;
    }
  });

  if (count_items === 0) { b.innerHTML = "<h3 style='width:100%;text-align:center;color:gray;'>No items available right now. Be the first to list something! ♻️</h3>"; }
  if (count_claimed === 0) { cList.innerHTML = "<li>No items claimed yet... be the first!</li>"; }
});

// submit form for new item - this part is kinda cool actually
document.getElementById('addItemForm').addEventListener('submit', async (ev) => {
  ev.preventDefault(); 
  let btn_submit = document.querySelector(".post-btn");
  let old_txt = btn_submit.innerText;
  btn_submit.innerText = "UPLOADING... ⏳";
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
  } catch (error) { console.log(error); alert("network error bro"); } 
  btn_submit.innerText = old_txt;
});

// putting this on window so the inline html onclick can actually see it
window.claimIt = async function(itemID) {
  let u_name = prompt("♻️ Awesome! Enter your name & class so the owner knows who to give it to:");
  if (!u_name || u_name.trim() === "") { return; }
  
  let the_card = document.getElementById("card-" + itemID);
  let the_btn = document.getElementById("btn-" + itemID);
  
  if (the_btn) { the_btn.innerText = "CLAIMED!"; the_btn.style.background = "green"; the_btn.disabled = true; }
  
  setTimeout(async function() {
    try {
      let r = doc(db, "listedItems", itemID);
      await updateDoc(r, { status: "claimed", claimedBy: u_name });
    } catch (e) {
      console.log("err: " + e); alert("🚨 ERROR: Couldn't connect to server!");
      if (the_btn) { the_btn.innerText = "CLAIM FOR FREE"; the_btn.style.background = ""; the_btn.disabled = false; }
    }
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
