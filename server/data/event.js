import { ObjectId } from "mongodb";
import { users } from "../config/mongoCollections.js";
import { schedules } from "../config/mongoCollections.js";
import { events } from "../config/mongoCollections.js";
import {requestData} from './index.js'
import validations from '../validation.js'
const createEvent = async (userId, eventData) => {
// const createEvent = async (userId, scheduleId, eventData) => {
    let errors = [];
  
    try {
      // userId = validations.checkId(userId, "userId");
      // scheduleId = validations.checkId(scheduleId, "scheduleId");
    } catch (e) {
      errors.push(e?.message);
    }
  
    try {
    //   validations.checkString(eventData.eventName, "Event Name");
    //  //do validation for other inputs
    //   validations.checkString(eventData.classification, "Classification");
    } catch (e) {
      errors.push(e?.message);
    }
  
    if (errors.length > 0) {
      throw [400, errors];
    }
  
    console.log("in data events")
    // if (!user) {
    //   throw [404, "User not found with this userId"];
    // }
  
    const eventsCollection = await events();
    const newEvent = {
      
      userId: userId,
      event_name: eventData.eventName,
      start_datetime: eventData.startDateTime,
      end_datetime: eventData.endDateTime,
      color_code: eventData.color,
      classification: eventData.desc,
      schedule_name: eventData.schedule,
      created_at: new Date(),
      updated_at: new Date(),
    };

    let receiver_emailId;
    let receiver;
  
    const userCollection = await users();

    if(eventData.shareEvent){
      receiver_emailId = eventData.shareEvent
      receiver = await userCollection.findOne(
        { email: receiver_emailId}
      );
      if(!receiver){
        throw [404, 'No user exists with emailId provided'];
      }
    }
    const insert = await eventsCollection.insertOne(newEvent);
    if (!insert.acknowledged || !insert.insertedId) {
      throw [404, "Could not create new event"];
    }

    // let obj={};
    
    let user = await userCollection.findOne(
      { uid: userId}
    );
    // if(eventData.shareEvent){
    //   obj.sender_email = user.email;
    //   obj.event = newEvent;
    //   receiver.requests.push(obj);
    // }

    // const receiverUpdateInfo = await userCollection.findOneAndUpdate({ email: receiver_emailId}, {
    //   $set: receiver
    // }, {returnDocument: 'after'});
    // if (receiverUpdateInfo.lastErrorObject.n === 0) {
    //   throw  'Failed to add people to the event';
    // }
    // 

    if(eventData.shareEvent){
      const receiverInsertInfo = await requestData.createRequest(user.email, receiver_emailId, newEvent);
      if ( !receiverInsertInfo.requestId)
        throw [404, "Could not add new request"];
    }
    // console.log(user)
    user.events.organizing.push(insert.insertedId.toString())
    const updatedInfo = await userCollection.findOneAndUpdate({ uid: userId }, {
      $set: user
    }, {returnDocument: 'after'});
    if (updatedInfo.lastErrorObject.n === 0) {
      throw  'Failed to update the user collection';
    }
  
    const insertedId = insert.insertedId.toString();
    return { eventId: insertedId };
  };

  const getEventById = async (id) => {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("Invalid id");
    }
    id = id.trim();
  
    if (!ObjectId.isValid(id)) {
      throw new Error("invalid object ID");
    }
  
    const eventsCollection = await events();
    const eventDetail = await eventsCollection.find({ _id: new ObjectId(id) }).toArray();
    if (eventDetail === null) {
      throw new Error("No schedule with that id");
    }
    return eventDetail || [];
  };
  

  const getEventsByUser = async (userId) => { 
    const eventsCollection = await events();
    // const eventsList = await eventsCollection.find({ userId: userId }).toArray();
    // console.log(eventsList)
  
    // if (eventsList.length === 0) {
    //   throw [404,"No events found for this user"];
    // }
    const usersCollection = await users();
    const user = await usersCollection.findOne({ uid: userId });

    if (!user) {
      throw [404, "User not found"];
    }

    const { attending, organizing } = user.events;
    const allEventIds = [...attending, ...organizing];

    if (allEventIds.length === 0) {
      throw [404, "No events found for this user"];
    }


    const eventsList = await eventsCollection.find({
      "_id": { $in: allEventIds.map(id =>new ObjectId(id)) }
    }).toArray();

    if (eventsList.length === 0) {
      throw [404, "No events found for this user"];
    }
    return eventsList;
  };

  const removeEvent = async (eventId) => {
    try {
      const eventsCollection = await events();
      const deletionInfo = await eventsCollection.findOneAndDelete({
        _id: new ObjectId(eventId),
      });
      if (deletionInfo.deletedCount === 0) {
        throw `Could not delete event with id ${eventId}`;
      }
      return true;
    } catch (error) {
      console.error(`Error occurred while deleting event: ${error}`);
      return false;
    }
  };

  const updateEvent = async (eventId, updatedData) => {
    try {
      eventId = validations.checkId(eventId, "eventId");
  
      const eventsCollection = await events();
      const existingEvent = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
  
      if (!existingEvent) {
        throw new Error(`Event not found with id ${eventId}`);
      }
     
      let updatedEvent = {};

      (updatedData.event_name) ? (updatedEvent.event_name = updatedData.event_name) : (updatedEvent.event_name = existingEvent.event_name);
      (updatedData.start_datetime) ? (updatedEvent.start_datetime = updatedData.start_datetime) : (updatedEvent.start_datetime = existingEvent.start_datetime);
      (updatedData.end_datetime) ? (updatedEvent.end_datetime = updatedData.end_datetime) : (updatedEvent.end_datetime = existingEvent.end_datetime);
      (updatedData.color_code) ? (updatedEvent.color_code = updatedData.color_code) : (updatedEvent.color_code = existingEvent.color_code);
      (updatedData.classification) ? (updatedEvent.classification = updatedData.classification) : (updatedEvent.classification = existingEvent.classification);
      
      if(updatedEvent){
        updatedEvent.updated_at = new Date()
      }
      const result = await eventsCollection.updateOne(
        { _id: new ObjectId(eventId) },
        { $set: updatedEvent }
      );

      if (result.modifiedCount === 0) {
        throw new Error(`Failed to update event with id ${eventId}`);
      }
  
      return true;
    } catch (error) {
      console.error(`Error occurred while updating event: ${error}`);
      return false;
    }
  };

  const getEventsBySchedule = async (scheduleId) => {
    let errors = [];
  
    try {
      scheduleId = validations.checkId(scheduleId, "scheduleId");
    } catch (e) {
      errors.push(e?.message);
    }
  
    if (errors.length > 0) {
      throw [400, errors];
    }
  
    const eventsCollection = await events();
    const events = await eventsCollection.find({ scheduleId: new ObjectId(scheduleId) }).toArray();
  
    if (events.length === 0) {
      throw [404, "No events found for this schedule"];
    }
  
    return events;
  };
  
  const checkEventAvailability = async (scheduleId, startDateTime, endDateTime) => {
    let errors = [];
  
    try {
      scheduleId = validations.checkId(scheduleId, "scheduleId");
     
      //do validation for startDateTime and endDateTime
  
  
    
      const startTime = new Date(startDateTime);
      const endTime = new Date(endDateTime);
      if (startTime >= endTime) {
        throw new Error("Start Date and Time must be before End Date and Time.");
      }
    } catch (e) {
      errors.push(e?.message);
    }
  
    if (errors.length > 0) {
      throw [400, errors];
    }
  
    const eventsCollection = await events();
    const overlappingEvents = await eventsCollection.find({
      scheduleId: new ObjectId(scheduleId),
      $or: [
        {
          start_datetime: { $lt: new Date(endDateTime) },
          end_datetime: { $gt: new Date(startDateTime) }
        }
      ]
    }).toArray();
  
    const isAvailable = overlappingEvents.length === 0;

  return isAvailable;
  };
  
  const getEventsByDateRange = async (scheduleId, startDate, endDate) => {
    let errors = [];
  
    try {
      scheduleId = validations.checkId(scheduleId, "scheduleId");
      //do validation for startDateTime and endDateTime

      
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      if (startDateTime >= endDateTime) {
        throw new Error("Start Date must be before End Date.");
      }
    } catch (e) {
      errors.push(e?.message);
    }
  
    if (errors.length > 0) {
      throw [400, errors];
    }
  
    const eventsCollection = await events();
    const eventsWithinDateRange = await eventsCollection.find({
      scheduleId: new ObjectId(scheduleId),
      start_datetime: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).toArray();
  
    return eventsWithinDateRange;
  };

  const getEventsByColorCode = async (colorCode) => {

    const eventsCollection = await events();
  
    const eventsByColorCode = await eventsCollection.find({
      color_code: colorCode,
    }).toArray();
  
    return eventsByColorCode;
  };

  const getEventsByColorCodeperUser = async (userId, colorCode) => {
    const eventsCollection = await events();
  
    const eventsByColorCode = await eventsCollection.find({
      userId: userId,
      color_code: colorCode,
    }).toArray();
  
    return eventsByColorCode;
  };
  
     const getEventsByStartDate = async (startDate) => {
  
      const eventsCollection = await events();
  
      const eventsByStartDate= await eventsCollection.find({
      start_datetime: { $gte: new Date(startDate) },
    }).toArray();
  
    return eventsByStartDate;
  };
  
  
   const getEventsByEndDate = async (endDate) => {
    console.log('Start Date:', startDate);
  
    const eventsCollection = await events();
  
    const eventByEndDate = await eventsCollection.find({
      end_datetime: { $lte: new Date(endDate) },
    }).toArray();
  
    return eventByEndDate;
  };
  
  
  
   const getEventsByClassification = async (classification) => {
  
    const eventsCollection = await events();
  
    const eventByClassification = await eventsCollection.find({
      classification,
    }).toArray();
  
    return eventByClassification;
  };

  const getEventsByClassificationByUser = async (userId,classification) => {

    const eventsCollection = await events();
  
    const eventByClassification = await eventsCollection.find({
      userId : userId,
      classification : classification,
    }).toArray();
  
    return eventByClassification;
  };
  
  
  
    export default {createEvent,getEventById,getEventsByUser,removeEvent,updateEvent,getEventsBySchedule,
      checkEventAvailability,getEventsByDateRange,getEventsByColorCode,getEventsByStartDate,getEventsByEndDate,getEventsByClassification,getEventsByColorCodeperUser,getEventsByClassificationByUser}