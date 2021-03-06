import {
	Accordion,
	Badge,
	Button,
	FloatingTooltip,
	Loader,
	MantineProvider,
	PasswordInput,
	Select,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import {
	NotificationsProvider,
	showNotification,
	updateNotification,
} from '@mantine/notifications';
import {
	IconAdjustments,
	IconCircleCheck,
	IconHeadphones,
} from '@tabler/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type CurrentlyPlaying = {
	CurrentlyPlaying?: {
		ReleaseId: string;
		TrackId: string;
		UserId: string;
		PlayTime: Date;
		CurrentPlayLocation: number;
		Duration: number;
		TrackTitle: string;
		TrackVersion: string;
		ReleaseTitle: string;
		ArtistsTitle: string;
		CatalogId: string;
	};
	playing: boolean;
};

const App = () => {
	const [listeningData, setListeningData] = useState<CurrentlyPlaying>(null);

	const [timeType, setTimeType] = useState('remaining');

	const StartOverlay = () => {
		return (
			<motion.div
				className='bg-black bg-opacity-75 w-screen h-screen absolute text-white grid place-items-center text-center transition-all duration-200 backdrop-blur select-none z-20'
				id='start-popup'
				initial={{
					opacity: 1,
				}}
				exit={{
					opacity: 0,
				}}
				transition={{
					delay: 0.5,
					duration: 0.25,
					ease: 'easeInOut',
				}}
			>
				<div className='transition-all duration-200'>
					<p className='text-3xl'>Loading...</p>
					<Loader className='mx-auto'></Loader>
				</div>
			</motion.div>
		);
	};

	const [overlay, setOverlay] = useState(StartOverlay);

	const SecretOverlay = () => {
		return (
			<motion.div
				initial={{
					opacity: 0,
				}}
				animate={{ opacity: 1 }}
				exit={{
					opacity: 0,
				}}
				className='bg-black bg-opacity-75 w-screen h-screen absolute text-white grid place-items-center text-center transition-all duration-200 backdrop-blur select-none z-20'
			>
				<div>
					<h1 className='text-3xl'>Monstercat Widget URL</h1>
					<p>Please enter the URL to your Stream Widget in the form below.</p>
					<br />
					<form
						method='get'
						onSubmit={(e) => {
							e.preventDefault();
							const data = new FormData(e.currentTarget);
							const secret = data.get('secret').toString();
							const scheme = 'https://player.monstercat.app/widget?code=owner-';
							if (
								!(
									secret.length > scheme.length &&
									secret.startsWith(scheme) &&
									secret.includes(scheme)
								)
							) {
								showNotification({
									message: 'Invalid URL!',
									title: 'Error',
									color: 'red',
								});
								return;
							}
							saveData('/secret', secret);
							showNotification({
								message: 'Welcome to mcat-discord-rpc!',
								color: 'green',
							});
							setOverlay(null);
						}}
					>
						<PasswordInput
							type='url'
							placeholder='Widget URL...'
							name='secret'
							label='URL'
						/>
					</form>
				</div>
			</motion.div>
		);
	};

	useEffect(() => {
		showNotification({
			id: 'start-notification',
			title: 'Loading...',
			loading: true,
			color: 'blue',
			message: 'Fetching data...',
			disallowClose: true,
		});

		fetch('http://localhost:8090/currentSong')
			.then((res) => res.json())
			.then((res) => {
				setListeningData(res);
			});

		setInterval(() => {
			fetch('http://localhost:8090/currentSong')
				.then((res) => res.json())
				.then((res) => {
					setListeningData(res);
				});
		}, 5000);

		fetch('http://localhost:8090/data', {
			method: 'POST',
		})
			.then((res) => res.json())
			.then((res) => {
				updateNotification({
					id: 'start-notification',
					title: 'Loading...',
					message: 'Validating data...',
					loading: true,
					color: 'blue',
					disallowClose: true,
				});
				setTimeType(res.timeType);
				updateNotification({
					id: 'start-notification',
					title: 'Welcome to mcat-discord-rpc!',
					message: 'Data loaded successfully.',
					loading: false,
					icon: <IconCircleCheck></IconCircleCheck>,
					color: 'green',
					autoClose: 3000,
					disallowClose: false,
				});
				if (!res.secret) {
					setOverlay(SecretOverlay);
					showNotification({
						message:
							'Please enter your Widget URL for Monstercat Discord RPC to work!',
						color: 'yellow',
					});
				} else {
					setOverlay(null);
				}
			});
	}, []);

	return (
		<>
			<MantineProvider theme={{ colorScheme: 'dark' }}>
				<NotificationsProvider>
					<div className='bg-neutral-900 w-screen h-screen top-0 left-0 -z-10 fixed'>
						<AnimatePresence exitBeforeEnter>
							<motion.img
								initial={{
									opacity: 0,
								}}
								animate={{
									opacity: 1,
								}}
								exit={{
									opacity: 0,
								}}
								className='bg-center bg-cover w-full h-auto blur-[128px] absolute top-0 left-0'
								src={`https://cdx.monstercat.com/?width=256&encoding=webp&url=https%3A%2F%2Fwww.monstercat.com%2Frelease%2F${listeningData?.CurrentlyPlaying?.CatalogId}%2Fcover`}
								alt=''
								key={listeningData?.CurrentlyPlaying?.CatalogId}
							/>
						</AnimatePresence>
						{listeningData?.CurrentlyPlaying ? (
							<div className='absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 z-0'></div>
						) : null}
					</div>
					<div className='text-white w-screen min-h-screen'>
						<AnimatePresence exitBeforeEnter>{overlay}</AnimatePresence>
						<div className='container mx-auto px-2'>
							<h1 className='text-3xl'>Hi there!</h1>
							<p>Welcome to the Monstercat Discord RPC!</p>
							<Tooltip label='Stop the RPC' withArrow color={'red'}>
								<Button
									color='red'
									variant='outline'
									className='mr-2'
									onClick={() => {
										fetch('http://localhost:8090/stop', {
											method: 'post',
										});
									}}
								>
									Stop
								</Button>
							</Tooltip>
							<Tooltip label='Start the RPC' withArrow color={'green'}>
								<Button
									color='green'
									variant='outline'
									className='mr-2'
									onClick={() => {
										fetch('http://localhost:8090/start', {
											method: 'post',
										});
									}}
								>
									Start
								</Button>
							</Tooltip>
							<Tooltip
								label='Stop the RPC completely'
								withArrow
								color={'grape'}
							>
								<Button
									color='grape'
									variant='outline'
									className='mr-2'
									onClick={() => {
										fetch('http://localhost:8090/kill', {
											method: 'post',
										});
									}}
								>
									Kill
								</Button>
							</Tooltip>
							<Tooltip
								label='Reconnects the RPC to Discord. Useful to connect after killing'
								withArrow
								color={'yellow'}
							>
								<Button
									color='yellow'
									variant='outline'
									className='mr-2'
									onClick={() => {
										fetch('http://localhost:8090/reconnect', {
											method: 'post',
										});
									}}
								>
									Reconnect
								</Button>
							</Tooltip>
							<Tooltip
								label='Clears your secret and reloads this window'
								withArrow
								color={'indigo'}
							>
								<Button
									color='indigo'
									variant='outline'
									onClick={() => {
										fetch('http://localhost:8090/logout', {
											method: 'post',
										});

										window.location.reload();
									}}
									className='mr-2'
								>
									Logout
								</Button>
							</Tooltip>

							<hr className='my-6' />

							<Accordion
								disableIconRotation
								styles={{
									control: {
										':hover': {
											backgroundColor: '#2c2e3333',
										},
									},
								}}
								initialItem={0}
							>
								<Accordion.Item
									label='Current'
									icon={
										<ThemeIcon color={'orange'} variant='light'>
											<IconHeadphones size={14}></IconHeadphones>
										</ThemeIcon>
									}
								>
									<div className='grid gap-4 grid-cols-4'>
										<FloatingTooltip
											label={listeningData?.CurrentlyPlaying?.CatalogId}
										>
											<img
												key={`${listeningData?.CurrentlyPlaying?.CatalogId} current`}
												src={`https://cdx.monstercat.com/?width=256&encoding=webp&url=https%3A%2F%2Fwww.monstercat.com%2Frelease%2F${listeningData?.CurrentlyPlaying?.CatalogId}%2Fcover`}
												alt='Cover'
												className='col-span-1'
											/>
										</FloatingTooltip>
										<div className='col-span-3'>
											<p className='text-3xl'>
												{listeningData?.CurrentlyPlaying?.TrackTitle}{' '}
												{listeningData?.CurrentlyPlaying?.TrackVersion != ''
													? `(${listeningData?.CurrentlyPlaying?.TrackVersion})`
													: ''}
											</p>
											<p className='text-2xl'>
												{listeningData?.CurrentlyPlaying?.ArtistsTitle}
											</p>
											<p>
												from {listeningData?.CurrentlyPlaying?.ReleaseTitle}
											</p>
											{listeningData?.CurrentlyPlaying?.TrackVersion ==
											undefined ? (
												<p>
													You're already listening? Don't worry, this should
													update in like 5 seconds.
												</p>
											) : (
												''
											)}
										</div>
									</div>
								</Accordion.Item>
								<Accordion.Item
									label='Settings'
									icon={
										<ThemeIcon color='violet' variant='light'>
											<IconAdjustments size={14} />
										</ThemeIcon>
									}
								>
									<h3 className='text-2xl'>
										Time type{' '}
										<Tooltip
											label='This setting is saving automatically'
											withArrow
											color={'green'}
										>
											<Badge color='green' variant='filled'>
												Autosaving
											</Badge>
										</Tooltip>
									</h3>
									<p>Select the time type you want to use.</p>
									<div className='my-4'></div>
									<Select
										placeholder='Pick a time type'
										value={timeType}
										styles={{
											input: {
												backgroundColor: '#2c2e3377',
											},
										}}
										data={[
											{ value: 'remaining', label: 'Time remaining (Song)' },
											{ value: 'elapsed', label: 'Time elapsed (Song)' },
											{ value: 'total', label: 'Time listening (Total)' },
										]}
										onChange={(v) => {
											setTimeType(v);
											console.log(v);
											const timeType = v;
											saveData('/timeType', timeType);
										}}
									/>
								</Accordion.Item>
							</Accordion>
						</div>
					</div>
				</NotificationsProvider>
			</MantineProvider>
		</>
	);
};

export default App;

function saveData(path: string, data: string) {
	fetch('http://localhost:8090/save', {
		headers: {
			path: path,
			data: data,
		},
		method: 'post',
	});
}
