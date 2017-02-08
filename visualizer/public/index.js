var db = firebase.database();
db.ref('sms').on('child_added', snapshot => {
  console.log('child added');
  let val = snapshot.val();
  console.log(val);
  console.log(val.emoji);
  if (val.emoji) {
    let emojiList = window.document.getElementById('emojis');
    let item = window.document.createElement('span');
    item.innerText = val.emoji + " ";
    emojiList.appendChild(item);
  }
});
