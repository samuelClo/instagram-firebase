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

const logFirebase = (email, password, type) => {
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            if (type === 'register')
                document.location.href = "./home.html"
            document.location.href = "./pages/home.html"
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
            const userPseudo = document.querySelector('input[data-type="pseudo"]').value
            const metadata = {contentType: 'image/jpeg'}

            user = firebase.auth().currentUser

            storageRef.child(pictureName)
            storageRef.child(`images/${pictureName}`)
            storageRef.child(`images/${pictureName}`).put(
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
                email
            }).then(function () {
                logFirebase(email, password, 'register')
            }).catch(function (error) {
                console.error("Error writing document: ", error)
            })
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
            document.querySelector('#logout').addEventListener('click',(e) => {
                e.preventDefault()
                document.location.href = "../index.html"
                firebase.auth().signOut()
            })
            const docRef = db.collection("users").doc(user.uid)

            docRef.get().then(function (doc) {
                if (doc.exists) {
                    const docData = doc._document.proto.fields

                    document.querySelector('#userCurrentProfil .displayprofilEmail').innerText = docData.email.stringValue
                    document.querySelector('#userCurrentProfil .displayProfilPseudo').innerText = docData.name.stringValue

                    storage.child(`images/${docData.profilPicture.stringValue}`).getDownloadURL().then(function (url) {
                        let xhr = new XMLHttpRequest()
                        xhr.responseType = 'blob'
                        xhr.onload = function (event) {
                            let blob = xhr.response
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
                    const title = document.querySelector('#publishTitle').value
                    const description = document.querySelector('#publishDescription').value
                    user = firebase.auth().currentUser
                    e.preventDefault()
                    if (picture && description && title) {
                        const pictureName = renamePicture(picture.name)
                        const metadata = {contentType: 'image/jpeg'}

                        const uploadTask = storageRef.child(`images/images-publication/${pictureName}`).put(
                            picture,
                            metadata
                        ).then(function () {
                            console.log("Document successfully written!")
                        }).catch(function (error) {
                            console.error("Error writing document: ", error)
                        })

                        db.collection("publication").add({
                            title,
                            description,
                            picture: pictureName,
                            creationDate: Date.now(),
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

                db.collection("users").doc(user.uid).collection('followPeople')
                    .onSnapshot(function (snapshot) {
                        let arrayUserFollowing = snapshot.docChanges().map(function (change) {
                            if (change.type === "added")
                                return change.doc.data().followUid
                        })
                        console.log(arrayUserFollowing)
                        //.where(user.uid, "in", arrayUserFollowing)
                        db.collection("publication").orderBy("creationDate")
                            .onSnapshot(function (snapshot) {
                                snapshot.docChanges().forEach(function (change) {
                                    if (change.type === "added") {
                                        console.log("add city: ", change.doc.data())
                                        console.log(change.doc.id)
                                        renderPublication({...change.doc.data(), docId: change.doc.id})
                                    }
                                    if (change.type === "modified") {
                                        console.log("Modified city: ", change.doc.data())
                                    }
                                    if (change.type === "removed") {
                                        console.log("Removed city: ", change.doc.data())
                                    }
                                })
                            })
                    })
            }).catch(function (error) {
                console.log("Error getting document:", error)
            })

            db.collection("users")
                .get()
                .then(function (querySnapshot) {
                    querySnapshot.forEach(function (doc) {
                        const data = doc.data()
                        const idDocument = doc.id

                        storage.child(`images/${data.profilPicture}`).getDownloadURL().then(function (url) {
                            const allProfilHtml = document.createElement('div')

                            allProfilHtml.classList.add("displayProfil")
                            allProfilHtml.innerHTML = `
                                <img src=${url} alt="">
                                <div class="displayProfilAssets">
                                    <span class="displayProfilPseudo">${data.name}</span>
                                    <span class="displayprofilEmail">${data.email} </span>
                                    <span data-uid=${idDocument} class="followUser"> follow </span>
                                </div>`
                            document.querySelector('#allUserDisplay').appendChild(allProfilHtml)
                            allProfilHtml.querySelector('.followUser').addEventListener('click', function () {
                                setFollow(idDocument)
                            })
                        }).catch(function (error) {
                            console.log(error)
                        })
                    })
                })
                .catch(function (error) {
                    console.log("Error getting documents: ", error)
                })

            const renderPublication = (data) => {
                if (!data.picture)
                    return null
                const docRef = db.collection("users").doc(data.uid)

                let isLiked = false
                let likeExist = true

                if (data.likes)
                    isLiked = data.likes.find( el => el === user.uid )


                const renderLike = () => {
                    if (user.uid === data.uid)
                        return ''
                    return (
                        `<img    
                        data-uid=${user.uid} 
                        data-doc-id=${data.docId} 
                        class="like" 
                        src=${isLiked ? "../assets/picture/like-fill-red.png" : "../assets/picture/like.png"}
                        data-is-liked="${isLiked ? 1 : 0}"
                        alt=""> `
                    )
                }

                if (user.uid === data.uid)
                    likeExist = false

                storage.child(`images/images-publication/${data.picture}`).getDownloadURL().then(function (urlPublicationPicture) {
                    docRef.get().then(function (doc) {
                        storage.child(`images/${doc.data().profilPicture}`).getDownloadURL().then(function (urlProfilPicture) {
                            let actuality = document.createElement('div')
                            actuality.classList.add('actuality')
                            actuality.innerHTML =
                              ` <aside class="actualityHeader">
                                    <div class="actualityProfilAsset">
                                        <img src="${urlProfilPicture}" alt="">
                                        <h4>${data.title}</h4>
                                    </div>
                                </aside>
                                <div class="actualityPicture">
                                    <img src="${urlPublicationPicture}" alt="">
                                </div>
                                <footer>
                                    <nav class="actualityAssetsLinks">
                                        ${renderLike()}
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
                            </div>`
                            document.querySelector('.actuality:first-child').parentNode.insertBefore(actuality, document.querySelector('.actuality:first-child').nextSibling)
                            actuality.querySelector('.like').addEventListener('click', () => likePublication(user.uid, data.docId))
                        }).catch(function (error) {
                            console.log(error)
                        })
                    }).catch(function (error) {
                        console.log("Error getting document:", error)
                    })
                }).catch(function (error) {
                    console.log(error)
                })
            }

            const setFollow = (uid) => {
                db.collection("users").doc(user.uid).collection('followPeople')
                    .add({followUid: uid})
                    .then(() => {
                        console.log('follow')
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            }
        } else {
            // No user is signed in.
        }
    })
}

const setFollow = (uid) => {
    db.collection("users").doc(user.uid).collection('followPeople')
        .add({followUid: uid})
        .then(() => {
            console.log('follow')
        })
        .catch((error) => {
            console.log(error)
        })
}

const likePublication = (uid, docId) => {
    const currentLike = document.querySelector(`.actualityAssetsLinks img[data-doc-id="${docId}"]`)

    if (currentLike.getAttribute('data-is-liked') === "0") {
        db.collection("publication").doc(docId).get().then(doc => {
            if (doc.exists) {
                doc.ref.update({
                    likes: firebase.firestore.FieldValue.arrayUnion(uid)
                })
                    .then(() => {
                        db.collection("publication").doc(docId).get().then(like => {
                            if (like.exists) {
                                console.log('like')
                            }
                        })
                        currentLike.setAttribute('data-is-liked', '1')
                        currentLike.src = '../assets/picture/like-fill-red.png'
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            }
        })
    } else {
        db.collection("publication").doc(docId).get().then(doc => {
            if (doc.exists) {
                doc.ref.update({
                    likes: firebase.firestore.FieldValue.arrayRemove(uid)
                })
                    .then(() => {
                        db.collection("publication").doc(docId).get().then(like => {
                            if (like.exists)
                                console.log('like')
                        })
                        currentLike.setAttribute('data-is-liked', '0')
                        currentLike.src = '../assets/picture/like.png'
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            }
        })
    }
}

const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max))
const renamePicture = (namePicture) => Date.now().toString() + getRandomInt(1000).toString() + namePicture

