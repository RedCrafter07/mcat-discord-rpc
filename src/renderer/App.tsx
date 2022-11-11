import {
	Accordion,
	Badge,
	Button,
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

const { ipcRenderer: ipc } = window.require('electron/renderer');

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
				className="bg-black bg-opacity-75 w-screen h-screen absolute text-white grid place-items-center text-center transition-all duration-200 backdrop-blur select-none z-20"
				id="start-popup"
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
				<div className="transition-all duration-200">
					<p className="text-3xl">Loading...</p>
					<Loader className="mx-auto"></Loader>
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
				className="bg-black bg-opacity-75 w-screen h-screen absolute text-white grid place-items-center text-center transition-all duration-200 backdrop-blur select-none z-20"
			>
				<div>
					<h1 className="text-3xl">Monstercat Widget URL</h1>
					<p>
						Please enter the URL to your Stream Widget in the form
						below.
					</p>
					<br />
					<form
						method="get"
						onSubmit={(e) => {
							e.preventDefault();
							const data = new FormData(e.currentTarget);
							const secret = data.get('secret').toString();
							const scheme =
								'https://player.monstercat.app/widget?code=owner-';
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
							placeholder="Widget URL..."
							name="secret"
							label="URL"
						/>
					</form>
				</div>
			</motion.div>
		);
	};

	useEffect(() => {
		(async () => {
			showNotification({
				id: 'start-notification',
				title: 'Loading...',
				loading: true,
				color: 'blue',
				message: 'Fetching data...',
				disallowClose: true,
				autoClose: false,
			});

			const getCurrentSong = async () => {
				const data: CurrentlyPlaying = await fetchIPC('currentSong');

				return data;
			};

			const listeningData = await getCurrentSong();
			setListeningData(listeningData);

			setInterval(async () => {
				const listeningData = await getCurrentSong();
				setListeningData(listeningData);
			}, 5000);

			const data = await fetchIPC('data');

			updateNotification({
				id: 'start-notification',
				title: 'Loading...',
				message: 'Validating data...',
				loading: true,
				color: 'blue',
				disallowClose: true,
			});
			setTimeType(data.timeType);
			updateNotification({
				id: 'start-notification',
				title: 'Welcome to mcat-discord-rpc!',
				message: 'Data loaded successfully.',
				loading: false,
				icon: <IconCircleCheck />,
				color: 'green',
				autoClose: 3000,
				disallowClose: false,
			});
			if (!data.secret) {
				setOverlay(SecretOverlay);
				showNotification({
					message:
						'Please enter your Widget URL for Monstercat Discord RPC to work!',
					color: 'yellow',
				});
			} else {
				setOverlay(null);
			}
		})();
	}, []);

	return (
		<>
			<MantineProvider theme={{ colorScheme: 'dark' }}>
				<NotificationsProvider>
					<div className="bg-neutral-900 w-screen h-screen top-0 left-0 -z-10 fixed">
						<AnimatePresence mode="wait">
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
								className="bg-center bg-cover w-full h-auto blur-[128px] absolute top-0 left-0"
								src={`https://cdx.monstercat.com/?width=256&encoding=webp&url=https%3A%2F%2Fwww.monstercat.com%2Frelease%2F${listeningData?.CurrentlyPlaying?.CatalogId}%2Fcover`}
								alt=""
								key={listeningData?.CurrentlyPlaying?.CatalogId}
							/>
						</AnimatePresence>
						{listeningData?.CurrentlyPlaying ? (
							<div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 z-0"></div>
						) : null}
					</div>
					<div className="text-white w-screen min-h-screen">
						<AnimatePresence mode="wait">{overlay}</AnimatePresence>
						<div className="container mx-auto p-2">
							<h1 className="text-3xl">Hi there!</h1>
							<p>Welcome to the Monstercat Discord RPC!</p>
							<div className="my-4" />
							<div className="flex flex-row gap-2">
								<Tooltip
									label="Stop the RPC"
									withArrow
									color={'red'}
								>
									<Button
										color="red"
										variant="outline"
										onClick={() => {
											ipc.send('stop');
										}}
									>
										Stop
									</Button>
								</Tooltip>
								<Tooltip
									label="Start the RPC"
									withArrow
									color={'green'}
								>
									<Button
										color="green"
										variant="outline"
										onClick={() => {
											ipc.send('start');
										}}
									>
										Start
									</Button>
								</Tooltip>
								<Tooltip
									label="Stop the RPC completely"
									withArrow
									color={'grape'}
								>
									<Button
										color="grape"
										variant="outline"
										onClick={() => {
											ipc.send('kill');
										}}
									>
										Kill
									</Button>
								</Tooltip>
								<Tooltip
									label="Reconnects the RPC to Discord. Useful to connect after killing"
									withArrow
									color={'yellow'}
								>
									<Button
										color="yellow"
										variant="outline"
										onClick={() => {
											ipc.send('reconnect');
										}}
									>
										Reconnect
									</Button>
								</Tooltip>
								<Tooltip
									label="Clears your secret and reloads this window"
									withArrow
									color={'indigo'}
								>
									<Button
										color="indigo"
										variant="outline"
										onClick={() => {
											ipc.send('logout');

											window.location.reload();
										}}
									>
										Logout
									</Button>
								</Tooltip>
								<Tooltip
									label="Open a window of the Monstercat Player (using mcat-discord-rpc)"
									withArrow
									color="orange"
								>
									<Button
										color="orange"
										variant="outline"
										onClick={() => {
											ipc.send('open-player');
										}}
									>
										Open player
									</Button>
								</Tooltip>
							</div>

							<div className="my-6 h-px bg-white opacity-25" />

							<Accordion
								styles={{
									control: {
										':hover': {
											backgroundColor: '#2c2e3333',
										},
									},
								}}
								defaultValue="current"
							>
								<Accordion.Item value="current">
									<Accordion.Control
										icon={
											<ThemeIcon
												color={'orange'}
												variant="light"
											>
												<IconHeadphones
													size={14}
												></IconHeadphones>
											</ThemeIcon>
										}
									>
										Current
									</Accordion.Control>
									<Accordion.Panel>
										<div className="gap-4 flex flex-col md:flex-row">
											<Tooltip.Floating
												label={
													listeningData
														?.CurrentlyPlaying
														?.CatalogId
												}
											>
												<img
													key={`${listeningData?.CurrentlyPlaying?.CatalogId} current`}
													src={`https://cdx.monstercat.com/?width=256&encoding=webp&url=https%3A%2F%2Fwww.monstercat.com%2Frelease%2F${listeningData?.CurrentlyPlaying?.CatalogId}%2Fcover`}
													alt="Cover"
													className="h-60 w-60"
												/>
											</Tooltip.Floating>
											<div className="flex-grow">
												<p className="text-2xl">
													{
														listeningData
															?.CurrentlyPlaying
															?.TrackTitle
													}{' '}
													{listeningData
														?.CurrentlyPlaying
														?.TrackVersion != ''
														? `(${listeningData?.CurrentlyPlaying?.TrackVersion})`
														: ''}
												</p>
												<p className="text-xl">
													{
														listeningData
															?.CurrentlyPlaying
															?.ArtistsTitle
													}
												</p>
												<p>
													from{' '}
													{listeningData
														?.CurrentlyPlaying
														?.ReleaseTitle ||
														'Unknown'}
												</p>
												{listeningData?.CurrentlyPlaying
													?.TrackVersion ==
												undefined ? (
													<p>
														You're already
														listening? Don't worry,
														this should update in
														like 5 seconds.
													</p>
												) : (
													''
												)}
												<p className="text-sm">
													Catalog ID:{' '}
													{listeningData
														?.CurrentlyPlaying
														?.CatalogId ||
														'Unknown'}
												</p>

												<div className="my-2" />

												<Button
													variant="outline"
													color="green"
													onClick={() => {
														open(
															`https://player.monstercat.app/release/${listeningData?.CurrentlyPlaying?.CatalogId}`,
															'_blank'
														);
													}}
													disabled={
														!listeningData?.CurrentlyPlaying
													}
												>
													Open in player
												</Button>
											</div>
										</div>
									</Accordion.Panel>
								</Accordion.Item>
								<Accordion.Item value="settings">
									<Accordion.Control
										icon={
											<ThemeIcon
												color="violet"
												variant="light"
											>
												<IconAdjustments size={14} />
											</ThemeIcon>
										}
									>
										Settings
									</Accordion.Control>
									<Accordion.Panel>
										<h3 className="text-2xl">
											Time type{' '}
											<Tooltip
												label="This setting is saving automatically"
												withArrow
												color={'green'}
											>
												<Badge
													color="green"
													variant="filled"
												>
													Autosaving
												</Badge>
											</Tooltip>
										</h3>
										<p>
											Select the time type you want to
											use.
										</p>
										<div className="my-4"></div>
										<Select
											placeholder="Pick a time type"
											value={timeType}
											styles={{
												input: {
													backgroundColor:
														'#2c2e3377',
												},
											}}
											data={[
												{
													value: 'remaining',
													label: 'Time remaining (Song)',
												},
												{
													value: 'elapsed',
													label: 'Time elapsed (Song)',
												},
												{
													value: 'total',
													label: 'Time listening (Total)',
												},
											]}
											onChange={(v) => {
												setTimeType(v);
												console.log(v);
												const timeType = v;
												saveData('/timeType', timeType);
											}}
										/>
									</Accordion.Panel>
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

async function saveData(path: string, data: string) {
	await ipc.send('save', path, data);
}

function fetchIPC(event: string) {
	return new Promise<any>(async (resolve) => {
		ipc.send(event);

		ipc.once(event, (e, data) => {
			resolve(data);
		});
	});
}
