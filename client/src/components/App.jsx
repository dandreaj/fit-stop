class App extends React.Component {
  constructor() {
    super();
    this.state = {
      currentState: 'Dashboard',
      currentWorkout: [],
      currentExercise: 0,
      workoutDate: null,
      workoutHistory: [],
      username: null,
      loggedIn: false,
      countdown: 3,
      time: null,
      showButtons: true,
      workoutLengthInMins: 15,
      loggedInToSpotify: false,
      deviceId: '',
      currentAlbumId: null
    };

    this.goToWorkout = this.goToWorkout.bind(this);
    this.goToSummary = this.goToSummary.bind(this);
    this.goToDashboard = this.goToDashboard.bind(this);
    this.goToCountdown = this.goToCountdown.bind(this);
    this.goToLogin = this.goToLogin.bind(this);
    this.goToSignUp = this.goToSignUp.bind(this);
    this.getWorkoutHistory = this.getWorkoutHistory.bind(this);
    this.sendWorkoutData = this.sendWorkoutData.bind(this);
    this.favorite = this.favorite.bind(this);
    this.logOut = this.logOut.bind(this);
    this.login = this.login.bind(this);
    this.signup = this.signup.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.getSpotifyToken = this.getSpotifyToken.bind(this);
  }

  componentDidMount() {
    if (this.getSpotifyToken()) {
      this.setState({loggedInToSpotify: true});
      this.getDeviceId();
      this.getCurrentAlbum();
    }
    this.getCurrentUser(this.goToDashboard);
  }

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  The following functions change the view on the app
* * * * * * * * * * * * * * * * * * * * * * * * * * */

  goToDashboard() {
    this.setState({currentState: 'Dashboard'});
    this.setState({showButtons: true});
    if (this.state.loggedIn && this.state.username) {
      this.getWorkoutHistory();
    }
    if (this.state.interval) {
      clearInterval(this.state.interval);
    }
  }

  goToLogin() {
    this.setState({currentState: 'Login'})
  }

  goToSignUp() {
    this.setState({currentState: 'SignUp'})
  }

  goToCountdown() {
    this.setState({currentState: 'Countdown'});
    this.setState({showButtons: false});
    this.setState({currentExercise: 0});
    this.getExercises();
    this.startCountdown();
  }

  goToWorkout() {
    this.setState({currentState: 'Workout'});
    this.startTimer();
    this.startPlayback();
  }

  goToSummary() {
    this.setState({currentState: 'Summary'});
    this.setState({showButtons: true});
    var currentDate = Date();
    this.setState({workoutDate: currentDate});
    clearInterval(this.state.interval);
    if (this.state.loggedIn) {
      this.sendWorkoutData();
    }
    if (this.state.loggedInToSpotify) {
      this.stopPlayback();
    }
  }

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  The following functions send requests to the server
* * * * * * * * * * * * * * * * * * * * * * * * * * */

  getWorkoutHistory() {
    $.ajax({
      method: 'GET',
      url: '/history',
      dataType: 'json',
      data: {
        username: this.state.username
      },
      complete: (data) => {
        var firstFive = JSON.parse(data.responseText).slice(0, 5);
        this.setState({workoutHistory: firstFive})
      },
      error: function(err) {
        console.error(err);
      }
    });
  }

  getExercises() {
    $.ajax({
      method: 'GET',
      url: '/workout',
      dataType: 'json',
      data: {
        lengthOfWorkout: this.state.workoutLengthInMins
      },
      complete: (data) => {
        this.setState({currentWorkout: JSON.parse(data.responseText)})
      },
      error: function(err) {
        console.error(err);
      }
    });
  }

  sendWorkoutData() {
    $.ajax({
      type: 'POST',
      url: '/addWorkout',
      data: JSON.stringify({
        username: this.state.username,
        date: Date(),
        currentWorkout: this.state.currentWorkout,
        lengthOfWorkout: this.state.workoutLengthInMins
      }),
      contentType: 'application/json',
      dataType: 'json',
      success: function (data) {
        console.log('succesfully posted data!');
      }
    });
  };

  favorite(exercise) {
    $.ajax({
      type: 'POST',
      url: '/user/favorites',
      data: JSON.stringify({
        username: this.state.username,
        currentExercise: exercise
      }),
      contentType: 'application/json',
      dataType: 'json',
      success: function (data) {
        console.log('succesfully posted data!');
      }
    });
  };

  login(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    var username = data.get('username');
    var password = data.get('password');

    $.ajax({
      type: "POST",
      url: '/login',
      data: JSON.stringify({
        username: username,
        password: password
      }),
      contentType: 'application/json',
      dataType: 'json',
      complete: data => {
        if (data.responseText === "Log in success") {
          this.setState({username: username});
          this.setState({loggedIn: true});
          this.goToDashboard();
        } else {
          alert("Username and Password Invalid");
          this.goToLogin();
        }
      }
    });
  }

  signup(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    var username = data.get('username');
    var password = data.get('password');
    var phonenumber = data.get('phonenumber');

    $.ajax({
      type: "POST",
      url: '/signup',
      data: JSON.stringify({
        username: username,
        password: password,
        number: phonenumber
      }),
      contentType: 'application/json',
      dataType: 'json',
      complete: data => {
        if (data.responseText === "User Created") {
          this.setState({username: username});
          this.setState({loggedIn: true});
          this.goToDashboard();
        } else {
          alert("Username and Password Invalid");
          this.goToSignUp();
        }
      }
    });
  }

  logOut() {
    this.setState({loggedIn: false});
    this.setState({username: null});
    this.goToDashboard();
    $.ajax({
      method: 'POST',
      url: '/logout',
      dataType: 'json',
      data: {
      },
      complete: (data) => {
        console.log('succesfully logged out');
        this.setState({loggedInToSpotify: false})
      },
      error: function(err) {
        //console.error(err);
      }
    });
  }

  getCurrentUser(callback) {
     $.ajax({
      method: 'GET',
      url: '/currentUser',
      dataType: 'json',
      data: {
      },
      complete: (data) => {
        if (data.responseText) {
          this.setState({username: data.responseText, loggedIn: true})
          callback();
        }
      },
      error: function(err) {
        //console.error(err);
      }
    });

  }


/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Countdown and Timer Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */

  startCountdown() {
    this.setState({countdown: 3});
    var interval= setInterval(this.countdown.bind(this), 1000);
    this.setState({interval: interval});
  }

  countdown() {
    var current = this.state.countdown;
    current--;
    this.setState({countdown: current});
    if (this.state.countdown === 0) {
      clearInterval(this.state.interval);
      this.goToWorkout();
    }
  }

  startTimer() {
    var current = this.state.workoutLengthInMins * 60;
    this.setState({time: current});
    var interval = setInterval(this.timer.bind(this), 1000);
    this.setState({interval: interval});
  }

  timer() {
    var current = this.state.time;
    current--;
    this.setState({time: current});
    if (this.state.time <= 0) {
      this.goToSummary();
    } else if (this.state.time % 60 === 0) {
      var next = this.state.currentExercise;
      next++;
      this.setState({currentExercise: next});
      this.refs.workoutPage.highlightActiveTitle();
    }
  }

  formatTime(seconds) {
    var mm = Math.floor(seconds / 60);
    var ss = seconds % 60;
    if (ss < 10) {
      ss = '0' + ss;
    }
    return mm + ':' + ss;
  }


/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  MusicPlayer helpers
* * * * * * * * * * * * * * * * * * * * * * * * * * */
getSpotifyToken() {
    const getHashParams = () => {
    let hashParams = {};
    let e, r = /([^&;=]+)=?([^&;]*)/g;
    let q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
      return hashParams;
    }

    const params = getHashParams();
    const access_token = params.access_token;
    const refresh_token = params.refresh_token;

    spotifyApi.setAccessToken(access_token);
    return access_token;
  }

  //get the active device for the host user who is signed in to Spotify
  getDeviceId() {
    spotifyApi.getMyDevices()
      .then((data) => {
        this.setState({deviceId : data.devices[0].id})
      }, (err) =>{
        console.error(err);
      });
  }

  loginToSpotify() {
    window.location.href = '/hostLogin';
  }

  startPlayback() {
    spotifyApi.play({
      device_id: this.state.deviceId,
      context_uri: this.state.currentAlbumId
    })
      .then(() => {
        console.log('starting playback')
      })
  }

  stopPlayback() {
    spotifyApi.pause({
      device_id: this.state.deviceId
    })
      .then(() => {
        console.log('stopping playback')
      })
  }

  getCurrentAlbum() {
    spotifyApi.getMyCurrentPlayingTrack()
      .then(data => {
        this.setState({currentAlbumId : data.item.album.uri})
      });
  }





/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Renders the components based on the current state
* * * * * * * * * * * * * * * * * * * * * * * * * * */

  render() {
    var toBeRendered = () => {
      if (this.state.currentState === 'Dashboard') {
        return (<Dashboard goToCountdown={this.goToCountdown} workoutHistory={this.state.workoutHistory} loggedIn={this.state.loggedIn} />);
      }
      if (this.state.currentState === 'Login') {
          return (<Login login={this.login} />);
      }
      if (this.state.currentState === 'SignUp') {
          return (<SignUp signup={this.signup}  />);
      }
      if (this.state.currentState === 'Countdown') {
          return (<Countdown countdown={this.state.countdown} />);
      }
      if (this.state.currentState === 'Workout') {
        return (<Workout
        exercise={this.state.currentWorkout[this.state.currentExercise]} timer={this.formatTime(this.state.time)}
        countdown={this.state.countdown}
        goToSummary={this.goToSummary}
        goToDashboard={this.goToDashboard}
        favorite={this.favorite}
        ref="workoutPage" />);
      }
      if (this.state.currentState === 'Summary') {
        return (<Summary goToDashboard={this.goToDashboard} currentWorkout={this.state.currentWorkout} workoutDate={this.state.workoutDate} workoutLengthInMins={this.state.workoutLengthInMins} loggedIn={this.state.loggedIn} />);
      }
    }

    return (
      <div className = "App">
        <Header username={this.state.username} goToLogin={this.goToLogin} goToSignUp={this.goToSignUp} loggedIn={this.state.loggedIn} logOut={this.logOut} showButtons={this.state.showButtons}/>
        {toBeRendered()}
        {this.state.currentState !== 'Login'
          && this.state.currentState !== 'SignUp'
          && this.state.currentAlbumId
          &&  this.state.loggedInToSpotify
          ? <MusicPlayer albumId={this.state.currentAlbumId}/>
          : this.state.currentState !== 'Login'
          && this.state.currentState !== 'SignUp'
          && <div className='musicButton' onClick={this.loginToSpotify}>
            <div className='musicBtnText'>Log into Spotify to activate player</div>
          </div>
        }
      </div>
    )
  }

} // End of Class

window.App = App;