const socket = new WebSocket('ws://localhost:8080');

let hasToSave = false;
let saved = true;
let starting = true;

socket.onopen = () => {
	socket.send('Hello There');
	changeState('Getting data...');
	socket.send('req_data');
};

let dataObj;

socket.onmessage = ({ data }) => {
	let json = JSON.parse(data);
	let input = json.data;
	if (!json.type) return;
	if (json.type === 'data') {
		dataObj = input;
		changeState('Validating data...');

		document
			.querySelector(`#${dataObj.timeType}`)
			.setAttribute('selected', 'true');

		if (!input.secret) {
			secretPopup();
			changeState('Waiting for user input...');
		} else {
			startRPC();
		}
	}

	if (json.type === 'confirm') {
		if (input === 'save') {
			if (hasToSave === true && saved === false) {
				hasToSave = false;
				saved = true;
			}
		} else if (input === 'rpc_start') {
			starting = false;
			changeState('Started!');
		}
	}
};

document.querySelector('#rpc-stop').addEventListener('click', () => {
	socket.send('req_rpc_stop');
});

document.querySelector('#rpc-start').addEventListener('click', () => {
	socket.send('req_rpc_start');
});

document.querySelector('#rpc-kill').addEventListener('click', () => {
	socket.send('req_rpc_kill');
});

document.querySelector('#rpc-con').addEventListener('click', () => {
	socket.send('req_rpc_reconnect');
});

document.querySelector('#rpc-logout').addEventListener('click', () => {
	socket.send('req_rpc_logout');
	window.location.reload();
});

function startRPC() {
	changeState('Starting RPC...');
	socket.send('req_rpc_start');
}

function changeState(state) {
	// eslint-disable-next-line no-undef
	$('#start-state').text(state);
	// eslint-disable-next-line no-undef
	if (state == 'Started!' && starting == false) {
		setTimeout(() => {
			// eslint-disable-next-line no-undef
			$('#start-popup').addClass('opacity-0');
			setTimeout(() => {
				// eslint-disable-next-line no-undef
				$('#start-popup').addClass('hidden');
			}, 200);
		}, 1000);
	}
}

function secretPopup() {
	hasToSave = true;
	saved = false;
	changeState('Waiting for user input...');
	// eslint-disable-next-line no-undef
	$('#secret-popup').removeClass('opacity-0 hidden');
	// eslint-disable-next-line no-undef
	$('#states').addClass('opacity-0 hidden');
}

document.querySelector('#secret-form').addEventListener('submit', (e) => {
	e.preventDefault();
	let secret = document.querySelector('#secret-form input').value;
	socket.send(`save_${JSON.stringify({ data: secret, path: '/secret' })}`);
	changeState('Saving...');
	// eslint-disable-next-line no-undef
	$('#secret-popup').addClass('opacity-0 hidden');
	// eslint-disable-next-line no-undef
	$('#states').removeClass('opacity-0 hidden');
	startRPC();
});

document.querySelector('#time-type-form').addEventListener('submit', (e) => {
	e.preventDefault();
	let val = document.querySelector('#time-type-form select').value;
	socket.send(`save_${JSON.stringify({ data: val, path: '/timeType' })}`);
	socket.send('req_data');
	/* changeState('Saving...');
	// eslint-disable-next-line no-undef
	$('#secret-popup').addClass('opacity-0 hidden');
	// eslint-disable-next-line no-undef
	$('#states').removeClass('opacity-0 hidden');
	startRPC(); */
});
