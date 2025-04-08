const jwt = require('jsonwebtoken');
const mongodbService = require('../../../common/services/mongodb.service');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const notificationSettingsService = require('../../notificationSettings/services/notificationSettings.service');

class UserService {
  constructor() {
    this.collection = 'users';
  }

  // Hash password using SHA-256


  // Generate JWT token
  generateToken(user) {
    const payload = {
      userId: user._id,
      phone: user.phone,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  }

  // Login user
  async login(phone, password, fcmToken) {

    if(!phone.startsWith('+971')){
      if(phone.startsWith('971')){
        phone = phone.replace('971', '+971');
      }
      else{
        phone = '+971'+phone;
      }
    }

    const user = await mongodbService.findOne(this.collection, { 
      phone,
      isActive: true,
      deletedAt: null
    });
    
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Generate token
    const token = this.generateToken(user);

    // Remove sensitive data from user object
    const { password: _, isActive: ___,deletedAt: _____,createdAt: ______,updatedAt: _______, ...safeUserData } = user;

    safeUserData.token = token;

    // Update FCM token if provided
    if (fcmToken) {
      await this.updateUserFcmToken(user._id, fcmToken);
    }


    return safeUserData
  }

  // Get user by ID
  async getUserById(id, {needPassword = false} = {}) {
    try {
      let excludeFields = [];
      if(!needPassword){
        excludeFields = ['password'];
      }
      return await mongodbService.findOne('users', {
        _id: new ObjectId(id),
        isActive: true,
        deletedAt: null
      }, excludeFields);
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  // Check if email exists
  async isEmailExists(email) {
    const user = await mongodbService.findOne(this.collection, { 
      email,
      isActive: true,
      deletedAt: null
    });
    return !!user;
  }

  // Check if phone exists
  async isPhoneExists(phone) {
    const user = await mongodbService.findOne(this.collection, { 
      phone,
      isActive: true,
      deletedAt: null
    });
    return !!user;
  }


  // Create new user
  async createUser(userData) {
    // Check if email already exists
    const emailExists = await this.isEmailExists(userData.email);
    if (emailExists) {
      throw new Error('Email already exists');
    }

    if(!userData.phone.startsWith('+971')){
      if(userData.phone.startsWith('971')){
        userData.phone = userData.phone.replace('971', '+971');
      }
      else{
        userData.phone = '+971'+userData.phone;
      }
    }
    const phoneExists = await this.isPhoneExists(userData.phone);
    if (phoneExists) {
      throw new Error('Phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const id = new ObjectId();
    
    // Prepare user data
    const newUser = {
      _id: id,
      ...userData,
      password: hashedPassword,
      isActive: true,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert user into database
    const user = await mongodbService.insertOne(this.collection, newUser);
    
    // Create notification settings for the new user
    await notificationSettingsService.createSettings(id, userData.role);

    return user;
  }

  // Update user
  async updateUser(userId, updateData, requestingUserId) {
    // Check if user exists and is active
    const existingUser = await this.getUserById(userId);
    
    if (!existingUser) {
      throw new Error('User not found');
    }
    if(requestingUserId !== userId && existingUser.role === 'super-admin'){
      throw new Error('Super admin cannot be updated');
    }

    const updateObj = {
      ...updateData,
      updatedAt: new Date()
    };

    if (updateData.role) {
      // Update notification settings with new role
      await notificationSettingsService.updateSettings(userId, updateData.role);
    }

    delete updateObj.isActive;
    delete updateObj.deletedAt;
    updateObj.modifiedBy = requestingUserId;
    updateObj.modifiedAt = new Date();

    const result = await mongodbService.updateOne(
      this.collection,
      { _id: new ObjectId(userId), isActive: true, deletedAt: null},
      { $set: updateObj }
    );

    return result;
  }

  // Soft delete user
  async deleteUser(userId) {
    // Soft delete user
    const result = await mongodbService.updateOne(
      this.collection,
      { _id: new ObjectId(userId), isActive: true, deletedAt: null },
      { 
        $set: {
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Soft delete notification settings
    await notificationSettingsService.deleteSettings(userId);

    return result;
  }

  async getUsers(filter = {}) {
    const defaultFilter={ 
      isActive: true,
      deletedAt: null
    }
    let userFilter = {
      ...defaultFilter,
    }
    const projection = {
      password: 0,
      isActive: 0,
      deletedAt: 0,
      createdAt: 0,
      updatedAt: 0
    };
    if(filter.role){
      userFilter.role = filter.role.toLowerCase();
    }
    if(filter.name){
      userFilter.name = { $regex: filter.name, $options: 'i' };
    }
    return mongodbService.find(this.collection, userFilter,{}, projection);
  }

  async resetPassword(userId, password) {
    // Check if user exists and is active
    const existingUser = await this.getUserById(userId);
    
    if (!existingUser) {
      throw new Error('User not found');
    }
    if(existingUser.role === 'super-admin'){
      throw new Error('Super admin cannot be updated');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await mongodbService.updateOne(
      this.collection,
      { _id: new ObjectId(userId), isActive: true, deletedAt: null }, 
      { $set: { password: hashedPassword } }
    );
    return result;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const existingUser = await this.getUserById(userId, {needPassword: true});
    if (!existingUser) {
      throw new Error('User not found');
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
    if (!isPasswordValid) {
      throw new Error('Invalid current password');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await this.updateUser(userId, { password: hashedPassword }, userId);
    return result;
  }

  async updateUserFcmToken(userId, fcmToken) {
    try {
      if (!fcmToken) return;

      await mongodbService.updateOne(
        'users',
        { _id: new ObjectId(userId) },
        {
          $addToSet: { fcmTokens: fcmToken },
          $set: { updatedAt: new Date() }
        }
      );
    } catch (error) {
      console.error('Update FCM token error:', error);
      throw error;
    }
  }

  async logout(userId, fcmToken) {
    try {
      if (fcmToken) {
        

       await mongodbService.updateOne(
        this.collection,
        { _id: new ObjectId(userId) },
        {
          $pull: { fcmTokens: fcmToken },
          $set: { updatedAt: new Date() }
        }
      );

    }

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getSuperAdminIds(){
    const superAdmins = await mongodbService.find('users', {role: 'super-admin', isActive: true, deletedAt: null}, {}, {_id: 1});
    return superAdmins.map(admin => admin._id);
  }

  async getUserIdsByRoles(roles){
    const users = await mongodbService.find('users', {role: { $in: roles }, isActive: true, deletedAt: null}, {}, {_id: 1});
    return users.map(user => user._id);
  }
  async getUserIdsFCMTokens(roles){
    try {
      const users = await mongodbService.find('users', {role: { $in: roles }, isActive: true, deletedAt: null}, {}, {_id: 1, fcmTokens: 1});
      return users.reduce((acc, user) => {
        acc[user._id] = user.fcmTokens;
        return acc;
      }, {});
    } catch (error) {
      console.error('Get user IDs FCM tokens error:', error);
      throw error;
    }
  }
}

module.exports = new UserService(); 