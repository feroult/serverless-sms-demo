var db = firebase.database();
db.ref('sms').on('child_added', snapshot => {
    console.log('child added');
    let val = snapshot.val();
    console.log(val);
    console.log(val.emoji);
    if (val.emoji) {
        let emojiList = window.document.getElementById('emojis');
        let item = window.document.createElement('span');
        let d = dimensions();
        item.innerText = val.emoji + " ";
        item.style.position = 'absolute';
        item.style.left = Math.floor(Math.random() * (d.x-100)) + 'px';
        item.style.top = Math.floor(Math.random() * (d.y-100)) + 'px';
        emojiList.appendChild(item);
    }
});

function dimensions() {
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x = w.innerWidth || e.clientWidth || g.clientWidth,
        y = w.innerHeight || e.clientHeight || g.clientHeight;
    return {x, y};
}
