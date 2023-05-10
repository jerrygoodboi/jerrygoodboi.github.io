function checkLogin() {
	const loginForm = document.getElementById('login-form');
	loginForm.addEventListener('submit', (event) => {
		  event.preventDefault();
	var username = document.getElementById("username").value;
	var password = document.getElementById("password").value;
	if (username == "user" && password == "pass") {
		window.location.href = 'home.html';
	} 
	});
}

