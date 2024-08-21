import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css'
import type { ReactNode} from 'react';

type ModalProps = {
	children: ReactNode
	OpenButton?: React.ComponentType<{ onClick: () => void }>
}

const Modal = (props: ModalProps) => {
	const { children, OpenButton } = props
	const [modalOpen, setModalOpen] = useState(false);
	const dialog = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		// console.log({dialog, modalOpen})
		if(modalOpen) dialog?.current?.showModal()
		else dialog?.current?.close()
	}, [modalOpen])

	return (
		<>
			{OpenButton ? 
				<OpenButton 
					onClick={() => setModalOpen(true)} 
				/> 
				: 
				<button 
					className={styles.open} 
					onClick={() => setModalOpen(true)}
				>
					Open Modal
				</button>
			}
			<dialog ref={dialog} className={styles.dialog}>
				<button className={styles.close} onClick={() => setModalOpen(false)}>
					✕ <span className="sr-only">Close</span>
				</button>
				{children}
			</dialog>
		</>
	)
}

export default Modal