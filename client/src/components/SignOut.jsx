// import React from 'react';
import {doSignOut} from '../firebase/FirebaseFunctions';
import { useSelector, useDispatch } from 'react-redux';
import actions from '../actions'
import { useNavigate } from 'react-router-dom';
const SignOutButton = () => {

const dispatch = useDispatch();
const navigate= useNavigate()
const signOutRedux = () => {
  dispatch(actions.unsetUser())
  doSignOut();
  navigate('/')
}

  return (
    <button className='button' type='button' onClick={signOutRedux}>
      Sign Out
    </button>
  );
};

export default SignOutButton;