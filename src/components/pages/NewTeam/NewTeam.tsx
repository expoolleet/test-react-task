import React, { useContext, useEffect, useRef, useState } from 'react'
import classes from './NewTeam.module.css'
import { Link, useNavigate } from 'react-router-dom'
import MyInput from '../../UI/MyInput/MyInput'
import MyButton from '../../UI/MyButton/MyButton'
import PhotoInput from '../../UI/PhotoInput/PhotoInput'
import { ITeam } from '../Teams/Teams'
import { TeamContext } from '../../context/TeamContext'
import Notification from '../../Notification/Notification'
import shared from '../../shared/AdditionalPages.module.css'
import { ErrorMessageType } from '../../UI/MyInput/MyInput'

const timeoutMS: number = 3000

const currentYear = new Date().getFullYear()

interface INewTeamProps {
	editTeam: ITeam
	isEditTeam: boolean
}

export default function NewTeam(props: any): React.ReactElement {
	const { editTeam, isEditTeam }: INewTeamProps = props

	const navigate = useNavigate()

	const { teams, setTeams } = useContext(TeamContext)

	const uploadRef = useRef<HTMLInputElement>(null)

	const [photo, setPhoto] = useState<any>()
	const [photoUrl, setPhotoUrl] = useState<string>('')

	const [isNotificationVisible, setIsNotificationVisible] = useState<boolean>(false)
	const [notificationMessage, setNotificationMessage] = useState<string>('')
	const [notificationType, setNotificationType] = useState<string>('')

	const [forcedErrorMessage, setForcedErrorMessage] = useState<ErrorMessageType>({
		name: '',
		isError: false,
	})

	const [values, setValues] = useState<ITeam>(
		isEditTeam
			? editTeam
			: {
					logo: '/portraits/team-placeholder.png', // Логотип команды по умолчанию
					name: '',
					division: '',
					conference: '',
					year: '',
			  }
	)

	const inputs = [
		{
			type: 'text',
			name: 'name',
			label: 'Name',
			errorMessage: 'Name should be 3-30 characters without any special symbol',
			pattern: `^[A-Za-z0-9 ]{3,30}$`,
		},
		{
			type: 'text',
			name: 'division',
			label: 'Division',
			errorMessage: 'Division should be 3-30 characters without any special symbol',
			pattern: `^[A-Za-z0-9 ]{3,30}$`,
		},
		{
			type: 'text',
			name: 'conference',
			label: 'Conference',
			errorMessage: 'Conference should be 3-30 characters without any special symbol',
			pattern: `^[A-Za-z0-9 ]{3,30}$`,
		},
		{
			type: 'number',
			name: 'year',
			label: 'Year of foundation',
			errorMessage: `Please enter year between 1900 and ${currentYear}`,
			placeholder: `${currentYear}`,
		},
	]

	function openPhoto(event: any): void {
		setPhoto(event.target.files[0])
	}

	useEffect(() => {
		return
		//----testing-----

		//input
		const formData = new FormData()
		formData.append('file', photo)
		formData.append('fileName', photo.name)
		formData.append('fileType', photo.type)
		localStorage.setItem('uploadedPhoto', JSON.stringify(formData))

		//output
		const parsedData = JSON.parse(localStorage.getItem('uploadedPhoto') as string)
		const newFormData = new FormData()
		for (let key in parsedData) newFormData.append(key, parsedData[key])
		const retrievedPhoto = newFormData.get('file')
		const photoName = newFormData.get('fileName')
		const photoType = newFormData.get('fileType')

		const retrievedFile = new File([retrievedPhoto as any], photoName as any, { type: photoType as any })
		setPhotoUrl(URL.createObjectURL(retrievedFile))

		console.log(photoUrl)
	}, [photo])

	function sendNotification(message: string, type: string): void {
		setNotificationMessage(message)
		setNotificationType(type)
		setIsNotificationVisible(true)
		setTimeout(() => {
			setIsNotificationVisible(false)
		}, timeoutMS)
	}

	// Функция-обработчик submit формы создания/редактирования команды
	function onFormSumbit(event: any): void {
		event.preventDefault()

		// Проверка заполненности полей
		for (const key in values) {
			if (values[key] === '') {
				sendNotification('Some inputs are missing data', 'error')
				return
			}
		}

		// Проверка на редактирование существующей команды
		if (!isEditTeam) {
			// Проверка существования команды при добавлении новой
			const isTeamExisting = teams.find((team) => team.name.toLowerCase() === values.name.toLowerCase())
			if (isTeamExisting) {
				sendNotification('Current team already exists', 'error')
				return
			}
		}

		// Проверка валидности года основания
		if (Number(values.year) < 1900 || Number(values.year) > currentYear) {
			setForcedErrorMessage({ name: 'year', isError: true })
			return
		}
		
		let newTeamsList: ITeam[] = []
		const newValues = {
			logo: values.logo,
			name: values.name,
			division: values.division,
			conference: values.conference,
			year: values.year,
		}

		// Редактирование существующей команды
		if (isEditTeam) {
			const team = teams.find((t) => t.name === editTeam.name) as ITeam
			const index = teams.indexOf(team)

			newTeamsList = teams
			newTeamsList[index] = newValues
		} else {
			// Добавление новой команды
			newTeamsList = [...teams, newValues]
		}

		// Обновление контекста команд и localStorage
		setTeams(newTeamsList)
		localStorage.setItem('teams', JSON.stringify(newTeamsList))

		// Отображение уведомления об успехе
		if (isEditTeam) sendNotification('Your team has been edited successfully', 'success')
		else {
			sendNotification('Your team has been added successfully', 'success')
			setValues({
				logo: '/portraits/team-placeholder.png',
				name: '',
				division: '',
				conference: '',
				year: '',
			})
		}

		// скрытие ошибок для инпутов после успешной отправки формы
		inputs.forEach((input) => {
			setForcedErrorMessage({ name: input.name, isError: false })
		})
	}

	// Функция-обработчик изменения значений полей формы
	function onChangeInput(event: any): void {
		setValues({ ...values, [event.target.name]: event.target.value })
	}

	return (
		<div className={[classes.container, shared.container].join(' ')}>
			<div className={shared.header}>
				<div>
					<span>
						<Link to='/'>Teams</Link>
					</span>{' '}
					<span>
						<Link to='/newteam'>{isEditTeam ? `Edit ${editTeam.name}` : 'Add new team'}</Link>
					</span>
				</div>
			</div>
			<form onSubmit={onFormSumbit}>
				<Notification type={notificationType} isVisible={isNotificationVisible}>
					{notificationMessage}
				</Notification>
				<PhotoInput uploadRef={uploadRef} openPhoto={openPhoto} background={photoUrl} />
				<div className={classes.inputs}>
					{inputs.map((input) => (
						<MyInput
							key={input.name}
							{...input}
							forcedErrorMessage={forcedErrorMessage}
							errorMessage={input.errorMessage}
							value={values[input.name]}
							onChange={onChangeInput}
						/>
					))}
					<div className={classes.buttons}>
						<MyButton
							onClick={() => {
								navigate('/')
							}}
							type='button'
							styleType='gray'>
							Cancel
						</MyButton>
						<MyButton>Save</MyButton>
					</div>
				</div>
			</form>
		</div>
	)
}
