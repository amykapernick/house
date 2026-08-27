import styles from './+page.module.css'
import type { PageLoad } from './$types';

export const load: PageLoad = () => ({ layoutWidth: `wide`, layoutClass: styles.layout });
