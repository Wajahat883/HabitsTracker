import { useContext } from 'react';
import HabitContext from './HabitContextStable';

export const useHabitContext = () => useContext(HabitContext);

export default useHabitContext;