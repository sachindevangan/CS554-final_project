import { ObjectId } from "mongodb";
import { users } from "../config/mongoCollections.js";
import { schedules } from "../config/mongoCollections.js";
import { events } from "../config/mongoCollections.js";
import validations from '../validation.js'

const createEvent = async (userId, scheduleId, eventData) => {
    let errors = [];
  
    try {
      userId = validations.checkId(userId, "userId");
      scheduleId = validations.checkId(scheduleId, "scheduleId");
    } catch (e) {
      errors.push(e?.message);
    }
  
    try {
      validations.checkString(eventData.eventName, "Event Name");
     //do validation for other inputs
      validations.checkString(eventData.classification, "Classification");
    } catch (e) {
      errors.push(e?.message);
    }
  
    if (errors.length > 0) {
      throw [400, errors];
    }
  
    const userCollection = await users();
    const user = await userCollection.findOne(
      { _id: new ObjectId(userId) },
      { password: 0 }
    );
  
    if (!user) {
      throw [404, "User not found with this userId"];
    }
  
    const eventsCollection = await events();
    const newEvent = {
      userId: ObjectId(userId),
      scheduleId: ObjectId(scheduleId),
      event_name: eventData.eventName,
      start_datetime: new Date(eventData.startDateTime),
      end_datetime: new Date(eventData.endDateTime),
      color_code: eventData.colorCode,
      classification: eventData.classification,
      created_at: new Date(),
      updated_at: new Date(),
    };
  
    const insert = await eventsCollection.insertOne(newEvent);
  
    if (!insert.acknowledged || !insert.insertedId) {
      throw [404, "Could not create new event"];
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
    const event = await eventsCollection.find({ userId: id }).toArray();
    if (event === null) {
      throw new Error("No schedule with that id");
    }
    return event || [];
  };
  

  const getEventsByUser = async (userId) => {
    let errors = [];
    try {
      userId = validations.checkId(userId, "userId");
    } catch (e) {
      errors.push(e?.message);
    }
  
    if (errors.length > 0) {
      throw [400, errors];
    }
  
    const eventsCollection = await events();
    const events = await eventsCollection.find({ userId: userId }).toArray();
  
    if (events.length === 0) {
      throw [404,"No events found for this user"];
    }
    return events;
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
  
      const updatedEvent = {
        ...existingEvent,
        ...updatedData,
        updated_at: new Date(),
      };
  
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
  


  export default {createEvent,getEventById,getEventsByUser,removeEvent,updateEvent,getEventsBySchedule,checkEventAvailability,getEventsByDateRange}