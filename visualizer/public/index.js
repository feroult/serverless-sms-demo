var db = firebase.database();
db.ref('sms').on('child_added', snapshot => {
    console.log('child added');
    let val = snapshot.val();
    console.log(val);
    console.log(val.emoji);
    if (val.emoji) {
        let emojiList = window.document.getElementById('emojis');
        let emoji = window.document.createElement('span');
        let text = window.document.createElement('span');

        let d = dimensions();
        var left = Math.floor(Math.random() * (d.x - 100));
        var top = Math.floor(Math.random() * (d.y - 100));

        emoji.innerText = val.emoji + " ";
        emoji.className = 'emoji';
        emoji.style.left = left + 'px';
        emoji.style.top = top + 'px';
        emojiList.appendChild(emoji);

        text.innerText = val.text ? val.text : '';
        text.className = 'text';
        text.style.left = (left + 58) + 'px';
        text.style.top = (top + 8) + 'px';
        emojiList.appendChild(text);

        setTimeout(() => {
            emoji.className = 'emoji fadeout';
            text.className = 'text fadeout';
        }, 3500);


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
