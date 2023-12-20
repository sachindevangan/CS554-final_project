import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

function RequestModal(props) {
  const [requests, setRequests] = useState(null);
  let [event, setEvent] = useState('')
  let auth = getAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/requests/${auth.currentUser.email}`);
        console.log(response.data);
        setRequests(response.data.requests);
        setEvent(response.data.requests)
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchData();
  }, []);

  const handleAccept = async(req) => {
    try {
      // Update the server to mark the request as accepted
      await axios.post(`http://localhost:3000/requests/accept`, {
        requestId: req._id,
        userId: auth.currentUser.uid,
        eventId: req.event._id,
      });

      // Fetch the updated requests after accepting
      const response = await axios.get(`http://localhost:3000/requests/${auth.currentUser.email}`);
      setRequests(response.data.requests);
      console.log(`Accepted invitation`)
    } catch (error) {
      console.error('Error accepting invite:', error);
    }
   
  };

  const handleReject = async(req) => {
    try {
      // Update the server to mark the request as accepted
      await axios.post(`http://localhost:3000/requests/reject`, {
        requestId: req._id,
        userId: auth.currentUser.uid,
        eventId: req.event._id,
      });

      
      console.log(`Invite request rejected `);
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  return (
    <div>
      {requests &&
        requests.map((req) => (
          <div key={req._id} className="request-card">
            <p>{req.sender_email}</p>
            <p>{req.event.event_name}</p>
            <p>{req.event.classification}</p>
            <p>{req.event.start_datetime}</p>
            <p>{req.event.end_datetime}</p>
            <div className="button-container">
              <button onClick={() => handleAccept(req)}>Accept</button>
              <button onClick={() => handleReject(req)}>Reject</button>
            </div>
          </div>
        ))}
    </div>
  );
}

export default RequestModal;
