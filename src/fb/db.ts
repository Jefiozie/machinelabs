import * as firebase from 'firebase';

export const db = this.db = firebase.initializeApp({
      apiKey: "AIzaSyDu0Qds2fWo8iZMcCj0T_ANqD9V4E0_9QY",
      authDomain: "machinelabs-a73cd.firebaseapp.com",
      databaseURL: "https://machinelabs-a73cd.firebaseio.com",
      storageBucket: "machinelabs-a73cd.appspot.com",
      messagingSenderId: "351438476852"
    }).database();