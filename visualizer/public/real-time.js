var db = firebase.database();

db.ref('hello').on('value', function (snapshot) {
    document.getElementById('hello').innerText = snapshot.val();
});
