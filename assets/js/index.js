// Your web app's Firebase configuration
let firebaseConfig = {
    apiKey: "AIzaSyB2x3-jNQRazyoypmhKqPgf-_G_ShJfiIU",
    authDomain: "projet-d-apprentissage.firebaseapp.com",
    databaseURL: "https://projet-d-apprentissage.firebaseio.com",
    projectId: "projet-d-apprentissage",
    storageBucket: "projet-d-apprentissage.appspot.com",
    messagingSenderId: "586489025266",
    appId: "1:586489025266:web:60e8c0eddfeb54e967f66b",
    measurementId: "G-LQNC52E0KY"
}
// Initialize Firebase
firebase.initializeApp(firebaseConfig)
let db = firebase.firestore()
const storage = firebase.storage().ref()
firebase.analytics()
let storageRef = firebase.storage().ref()

if (document.querySelector('.connexionFormContainer input[data-type="connexion"]')) {
    document.querySelector('.connexionFormContainer input[data-type="connexion"]').addEventListener("click", (e) => {
        e.preventDefault()
        logFirebase(
            document.querySelector('.connexionFormContainer input[type="email"]').value,
            document.querySelector('.connexionFormContainer input[type="password"]').value
        )
    })
}

if (document.querySelector('.connexionFormContainer input[data-type="register"]')) {
    document.querySelector('.connexionFormContainer input[data-type="register"]').addEventListener("click", (e) => {
        e.preventDefault()
        authFirebase(
            document.querySelector('.connexionFormContainer input[type="email"]').value,
            document.querySelector('.connexionFormContainer input[type="password"]').value
        )
    })
}

let logFirebase = (email, password) => {
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            console.log('connection suceed')
        })
        .catch(function (error) {
            console.log(error)
        })
}

const authFirebase = (email, password) => {
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            const picture = document.querySelector('input[type="file"]').files[0]
            const pictureName = renamePicture(picture.name)
            user = firebase.auth().currentUser
            const userPseudo = document.querySelector('input[data-type="pseudo"]').value

            let mountainsRef = storageRef.child(pictureName)
            let mountainImagesRef = storageRef.child(`images/${pictureName}`)

            const metadata = {contentType: 'image/jpeg'}

            const uploadTask = storageRef.child(`images/${pictureName}`).put(
                picture,
                metadata
            )

            user.updateProfile({
                displayName: userPseudo,
                photoURL: pictureName
            }).then(function () {
                console.log(firebase.auth().currentUser)
            }).catch(function (error) {
                console.log(error)
            })

            db.collection("users").doc(user.uid).set({
                name: userPseudo,
                profilPicture: pictureName,
                email: email
            }).then(function () {
                console.log("Document successfully written!")
            }).catch(function (error) {
                console.error("Error writing document: ", error)
            })
            console.log('inscription suceed')
        })
        .catch(function (error) {
            console.log(error)
            let errorCode = error.code
            let errorMessage = error.message
            if (errorCode == 'auth/weak-password') {
                alert('The password is too weak.')
            } else {
                alert(errorMessage)
            }
        })
}

if (document.querySelector('#userCurrentProfil')) {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            let docRef = db.collection("users").doc(user.uid)
            docRef.get().then(function (doc) {
                if (doc.exists) {
                    const docData = doc._document.proto.fields

                    document.querySelector('#userCurrentProfil .displayprofilEmail').innerText = docData.email.stringValue
                    document.querySelector('#userCurrentProfil .displayProfilPseudo').innerText = docData.name.stringValue

                    storage.child(`images/${docData.profilPicture.stringValue}`).getDownloadURL().then(function (url) {
                        var xhr = new XMLHttpRequest()
                        xhr.responseType = 'blob'
                        xhr.onload = function (event) {
                            var blob = xhr.response
                        }
                        xhr.open('GET', url)
                        xhr.send()

                        document.querySelector('#userCurrentProfil  > img').src = url
                    }).catch(function (error) {
                        console.log(error)
                    })
                } else {
                    console.log("No such document!")
                }
            }).catch(function (error) {
                console.log("Error getting document:", error)
            })

            db.collection("users")
                .get()
                .then(function (querySnapshot) {
                    let allProfilHtml
                    querySnapshot.forEach(function (doc) {
                        const data = doc.data()

                        storage.child(`images/${data.profilPicture}`).getDownloadURL().then(function (url) {
                            var xhr = new XMLHttpRequest()
                            xhr.responseType = 'blob'
                            xhr.onload = function (event) {
                                var blob = xhr.response
                            }
                            xhr.open('GET', url)
                            xhr.send()

                            allProfilHtml = `
                            <div class="displayProfil">
                                <img src=${url} alt="">
                                <div class="displayProfilAssets">
                                    <span class="displayProfilPseudo">${data.name}</span>
                                    <span class="displayprofilEmail">${data.email} </span>
                                </div>
                            </div>
                            `
                            document.querySelector('#allUserDisplay').innerHTML += allProfilHtml
                        }).catch(function (error) {
                            console.log(error)
                        })
                    })
                })
                .catch(function (error) {
                    console.log("Error getting documents: ", error)
                })
        } else {
            // No user is signed in.
        }
    })
    document.querySelector('#fileAddPictureActuality').addEventListener('change', function () {
        let fileReader = new FileReader()

        fileReader.readAsDataURL(this.files[0])

        fileReader.onload = function (e) {
            document.querySelector('#pictureAddActuality').src = e.target.result
            document.querySelector('#pictureAddActuality').style.width = "100%"
            document.querySelector('#pictureAddActuality').classList.add('pictureAddActualityMobile')
            document.querySelector('#pictureAddActuality').classList.remove('pictureAddActualityMobile')
        }
    })

    let addPictureState = false

    document.querySelector('#pictureAddActuality').addEventListener('click', () => {
        document.querySelector('#fileAddPictureActuality').click()
    })

    document.querySelector('#publishActuality').addEventListener('click', (e) => {
        const picture = document.querySelector('#fileAddPictureActuality').files[0]
        const description = document.querySelector('#publishDescription').value
        user = firebase.auth().currentUser
        e.preventDefault()
        if (picture && description) {
            const metadata = {contentType: 'image/jpeg'}

            const uploadTask = storageRef.child(`images/images-publication/${renamePicture(picture.name)}`).put(
                picture,
                metadata
            ).then(function () {
                console.log("Document successfully written!")
            }).catch(function (error) {
                console.error("Error writing document: ", error)
            })

            db.collection("publication").add({
                description: description,
                picture: renamePicture(picture.name),
                uid: user.uid
            }).then(function () {
                console.log("Document successfully written!")
            }).catch(function (error) {
                console.error("Error writing document: ", error)
            })
        } else {
            console.log('il manque des info')
        }
    })

    db.collection("publication")
        .onSnapshot(function (snapshot) {
            snapshot.docChanges().forEach(function (change) {
                if (change.type === "added") {
                    console.log("add city: ", change.doc.data());
                    createPublication(change.doc.data())
                }
                if (change.type === "modified") {
                    console.log("Modified city: ", change.doc.data());
                }
                if (change.type === "removed") {
                    console.log("Removed city: ", change.doc.data());
                }
            });
        });
}

const createPublication = (data) => {
    storage.child(`images/images-publication/${data.picture}`).getDownloadURL().then(function (url) {
        var xhr = new XMLHttpRequest()
        xhr.responseType = 'blob'
        xhr.onload = function (event) {
            var blob = xhr.response
        }
        xhr.open('GET', url)
        xhr.send()
        document.querySelector('.actuality:first-child').insertAdjacentHTML('afterend',
            `
        <div class="actuality">
                <aside class="actualityHeader">
                    <div class="actualityProfilAsset">
                        <img src="../assets/picture/template.png" alt="">
                        <h4>titre de la publication</h4>
                    </div>
                </aside>
                <div class="actualityPicture">
                    <img src="${url}" alt="">
                </div>
                <footer>
                    <nav class="actualityAssetsLinks">
                        <img src="../assets/picture/like.png" alt="">
                        <img src="../assets/picture/comment.png" alt="">
                        <img src="../assets/picture/export.png" alt="">
                    </nav>
                    <div class="likeByContainer">
                        <img src="https://picsum.photos/200/300" class="likeByPicture" alt="">
                        <p class="likeByPicturetext">
                            Aimé par <span class="bold">jermeie</span> et <span class="bold">75 autres personnes</span>
                        </p>
                    </div>
                    <div class="commentAllContainers">
                        <div class="commentContainer">
                            <p>
                                <span class="bold">m.arjane_h</span>
                                ${data.description}
                            </p>
                            <span class="displayAllComment"> Afficher les 22 commentaires</span>
                            <p>
                                <span class="bold">charlotte_fritz_lahaye</span>
                                J’tentoure moi ?
                            </p>
                            <p>
                                <span class="bold">charlotte_fritz_lahaye</span>
                                J’tentoure moi ?
                            </p>
                        </div>
                        <span class="actualityPublishDate">
                            17 OCTOBRE
                        </span>
                    </div>
                </footer>
                <form action="" class="addComment">
                    <input class="addCommentInput" type="text" placeholder="Ajouter un commentaire">
                    <input type="submit" value="Publier" class="submitAddComment">
                </form>
            </div>
        </div>
        `)


    }).catch(function (error) {
        console.log(error)
    })

}

const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max));
const renamePicture = (namePicture) => Date.now().toString() + getRandomInt(1000).toString() + namePicture

