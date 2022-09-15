#ifndef VREP_PROXY_HPP_
#define VREP_PROXY_HPP_

// System Header files
#include <iostream>
#include <map>

// V-REP header files
extern "C" {
#include "extApi.h"
}

// Eigen Header files
#include <Eigen\Dense>

// Project Header files
#include "SystemProxyInterface.hpp"

class VREPProxy : public SystemProxyInterface {


public:

	/**
	* @brief Default constructor of the VREPProxy class
	*
	*/
	VREPProxy();

	/**
	* @brief Default destroyer of the VREPProxy class
	*
	*/
	~VREPProxy();

	/**
	* @brief Init function
	* This function initializes the V-REP Remote APIs and opens the connection with the simulator
	*/
	void init();

	/**
	* @brief Close function
	* This function closes the V-REP Remote APIs and the connection with the simulator
	*/
	void close();

	/**
	* @brief Start simulation function
	* Play the simulation in the currently opened V-REP scene
	* @param simport: the connection port
	*/
	void startSim(const int& simport = 19997);

	/**
	* @brief Stop simulation function
	* Stop the simulation in the currently opened V-REP scene
	*/
	void stopSim(const int& simport = 19997);

	/**
	* @brief Set function
	* Set the IP address of the V-REP simulator server
	*/
	inline void setIPAddress(const std::string& ip_) { this->IPaddr = ip_; }

	/**
	*@brief Error Connection Message of the sensor
	*@return the message string
	*/
	char* errorConnectionMessage();

	/**
	* @brief Set function
	* Set the running flag
	* @param the running flag
	*/
	inline void setRunning(const bool& run_) { this->running = run_; }

	/**
	* @brief Check function
	* Check the running flag
	* @return the running flag
	*/
	inline bool isRunning() { return this->running; }

	/**
	* @brief Set function
	* Set the active tool V-REP handler
	* @param the active tool V-REP handler
	*/
	inline void setActiveToolHdl(const int& idx_) { this->activeToolHdl = idx_; }

	/**
	* @brief Get function
	* Get the active tool V-REP handler
	* @return the active tool V-REP handler
	*/
	inline int getActiveToolHdl() { return this->activeToolHdl; }

	/**
	* @brief Load function
	* Load the tool identified by the input string on the corresponding system
	* @param the string containing the path of the file corresponding to the tool to be loaded
	*/
	void loadTool(const char* toolName, const int& simport);

	/**
	* @brief Set function
	* Set the given pose of the currently tracked tool to the corresponding object in V-REP simulation
	* @param the array containing the pose of the currently tracked tool
	*/
	void setToolPose(const double* pose, const int& simport);

	/**
	* @brief Get function
	* Get the position of the V-REP object corresponding to the currently tracked tool
	* @param [output] the array filled with the position of the currently tracked tool
	*/
	void getToolPosition(simxFloat* position);

	/**
	* @brief Set function
	* Set the pose of the Polaris camera in the V-REP scene, from the given input transformation matrix
	* @param the transformation matrix Tctp
	* @param simport the connecting port
	*/
	void setPolarisPose(const Eigen::Matrix4d& Tctp, const int& simport);

	/**
	* @brief Set function
	* Set the pose of the Phantom camera in the V-REP scene, from the given input transformation matrix
	* with respect to the specified refernce frame
	* @param the transformation matrix Txct
	* @param the reference frame of the transformation to be set
	* @param simport the connecting port
	*/
	void setPhantomPose(const Eigen::Matrix4d& Txct, const int& frame_ref, const int& simport);

	/**
	* @brief Set function
	* Set the pose of the desired antenna in the V-REP scene, from the given input vector
	* @param the 7D pose vector
	*/
	void setAntennaDesPose(const Eigen::Matrix<double, 7, 1>& pose);

	//*******************************************************************************************************************************************************************************

	/**
	* @brief Get function
	* Get the active tool V-REP handler
	* @return the active tool V-REP handler
	*/
	inline int getClientID() { return this->clientID; }


	/**
	* @brief Get function
	* Get the active tool V-REP handler
	* @param the port at which we stay connected
	* @return the active tool V-REP handler
	*/
	inline int getClientID(const int& port) { return this->portIdMap[port]; }

	/**
	* @brief Get function
	* Get the pose of the desired antenna from the V-REP scene
	* @param the 4x4 homogeneous transformation matrix
	* @param string indicating to which object the pose must be expressed
	*/
	void getAntennaDesPose(Eigen::Matrix4d& pose_des, const std::string& ref, int simx_opmod, const bool& gross=false);
	
	/**
	* @brief Get function
	* Get the pose of the desired antenna from the V-REP scene
	* @param the 4x4 homogeneous transformation matrix
	* @param string indicating to which object the pose must be expressed
	*/
	void getAntennaPose(Eigen::Matrix4d& pose, const std::string& ref, int simx_opmode);

	/**
	* @brief Get function
	* Get the pose of the robot base from the V-REP scene
	* @param the 4x4 homogeneous transformation matrix
	* @param string indicating to which object the pose must be expressed
	*/
	void getRobotBasePose(Eigen::Matrix4d& pose, const std::string& ref, int simx_opmode);

	/**
	* @brief Get function
	* Get the pose of the probe object from the V-REP scene w.r.t. polaris frame
	*/
	void getProbePose(double* pose);

	/**
	* @brief Set function
	* Set the pose of the probe object from the V-REP scene
	*@param pose: the pose of the probe
	*/
	void setProbePose(double* pose);

	/**
	* @brief Get function
	* Get the pose of the ee w.r.t. the last robot frame (which is the forse sensor frame in case of Panda robot) from the V-REP scene
	* @param pose: position and orientation of the end-effector w.r.t. the last robot frame
	*/
	void getTeeOffset(Eigen::Matrix4d& pose);

	/**
	* @brief Get function
	* Get the joint position from the V-REP scene
	* @param configuration vector q [out]
	* @param simport the communication port
	* @param simx_opmode the communication mode
	*/
	void getJointPosition(Eigen::VectorXd& q, const int& simport, const int& simx_opmode);

	/**
	* @brief Get function
	* Get the joint velocity from the V-REP scene
	* @param configuration vector dq
	*/
	void getJointVelocity(Eigen::VectorXd& dq, const int& simport, const int& simx_opmode);

	/**
	* @brief Get function
	* Get the antenna velocity from the V-REP scene
	* @param antenna velocity
	* @param simc_opmode: opmode for Vrepp call
	*/
	void getAntennaVelocity(Eigen::VectorXd & eeV, int simx_opmode);

	/**
	* @brief Get function
	* Get the robot pose from the V-REP scene
	* @param transformation matrix Twr
	*/
	void getRobotPose(Eigen::Matrix4d& Twr);

	/**
	* @brief Get function
	* Get the joint torque from the V-REP scene
	* @param tau vector
	* @param simport the communication port
	* @param simx_opmode the communication mode
	*/
	void getJointTorque(Eigen::VectorXd& tau, const int& simport, const int& simx_opmode);

	/**
	* @brief Get function
	* Get the force sensor measure from the V-REP scene
	* @param force vector
	*/
	void getForceMsr(Eigen::VectorXd & forceMsr, int simx_opmode);

	/**
	* @brief Set function
	* Set the joint position in the V-REP scene
	* @param configuration vector q
	* @param simport: the connected port
	* @param simx_opmode: the transmission modelity
	*/
	void setJointPosition(const Eigen::VectorXd& q, const int& simport, int simx_opmode);

	/**
	* @brief Set function
	* Set the target joint position in the V-REP scene
	* @param configuration vector q
	*/
	void setJointTargetPosition(Eigen::VectorXd& q, const int& simport, const int& simx_opmode);

	/**
	* @brief Set function
	* Set the joint target velocity in the V-REP scene
	* @param velocity vector dq
	* @param simport: the connected port
	* @param simx_opmode: the transmission modelity
	*/
	void setJointTargetVelocity(const Eigen::VectorXd& dq, const int& simport, const int& simx_opmode);

	/**
	* @brief Set function
	* Set the joint torque in the V-REP scene
	* @param torque vector
	* @param simport: the simulation port for the V-REP connection
	* @param simx_opmode: mode of connection
	*/
	void setJointTorque(const Eigen::VectorXd& tau, const int& simport, int simx_opmode);

	/**
	* @brief Set function
	* Set the pose of the desired antenna in the V-REP scene, from the given homogeneous transformation matrx
	* @param the 4x4 homogeneous transformation matrix
	* @param simport: the connection port
	*/
	void setAntennaDesPose(const Eigen::Matrix4d& Tpm_, const int& simport);

	/**
	* @brief Get function
	* Get the pose of the desired antenna from the V-REP scene
	* @param the 4x4 homogeneous transformation matrix
	* @param string indicating to which object the pose must be expressed
	* @param flag stating if the desired pose is for the "adjustment" task
	*/
	void setAntennaDesPose(Eigen::Matrix4d& Tdes, const std::string& ref, const bool& poseAdj);

	/**
	* @brief Send function
	* Send the error positionining signals on V-REP
	* @param error the error position vector
	*/
	void sendErrorSignals(const Eigen::Matrix<double, 6, 1>& error, float det_JJT);

	/**
	* @brief Send function
	* Send the configuration signals on V-REP
	* @param signal vector
	*/
	void sendSignals(const Eigen::VectorXd& s, std::string& type);

	/**
	* @param Check function
	* Wait for the V-REP simulation  to end
	* @return a id code
	*/
	int waitForSimulationEnded();

	/**
	* @brief Show function
	* Show the input point in the simulated scene as a dummy object
	* @param the 3D coordinates of the given point, in the vision sensor frame
	*/
	void showPoint(const Eigen::Vector3d& p, const int& frame_ref, const int& simport);

	/**
	* @brief Show function
	* Show the input reference frame in the simulated scene as a dummy object
	* @param T: the 4x4 homogeneous transformation matrix representing the desired reference frame
	*/
	void showFrame(const Eigen::Matrix4d& T, const simxUChar* color, const int& simport);

	/**
	* @brief Get function
	* Get the position of the CT landmarks
	* @return: 4x3 matrix of position vectors
	*/
	Eigen::MatrixXf getCTPoints();

	/**
	* @brief Get function
	* Get the position of the CT landmarks
	* @return: 4x3 matrix of position vectors
	*/
	Eigen::MatrixXf getCTPointsPolaris();

	/**
	* @brief Get function
	* Get the position of the desired landmarks of the desired antenna configuration
	*/
	Eigen::MatrixXf getDesPosLandmarks(int numPoint);

	/**
	* @brief Set function
	* Set the synchro flag
	**/
	void setSynchro(bool synchro) { this->synchro = synchro; }

	/**
	* @brief Get function
	* Get the synchro flag
	*/
	bool getSynchro() { return this->synchro; }

	/**
	* @brief Set function
	* Set the routine flag
	**/
	void setReadSimRealSensor(bool readSimRealSensor) { this->readSimRealSensor = readSimRealSensor; }

	/**
	* @brief Get function
	* Get the routine flag
	*/
	int getReadSimRealSensor() { return this->readSimRealSensor; }

	/**
	* @brief Get function
	* Retrieves the list of simulated objects name used during the simulation
	* @return the list of object names
	*/
	inline std::map < std::string, int > getSimObjects() { return this->simObjects; }

	/**
	* @brief Set function
	* Set the name of the desired antenna object in the CoppeliaSim scene
	* @param s: the name of the desired antenna object in the CoppeliaSim scene
	*/
	inline void setDesAntennaObjName(const std::string& s) { this->desAntennaName = s; }
	
	/**
	* @brief Set function
	* Set the name of the patient reference frame in the CoppeliaSim scene
	* @param s: the name of the patient reference frame in the CoppeliaSim scene
	*/
	inline void setPatientFrameName(const std::string& s) { this->patientFrameName= s; }

	/**
	* @brief Set function
	* Set the name of the patient surface object in the CoppeliaSim scene
	* @param s: the name of the patient surface object in the CoppeliaSim scene
	*/
	inline void setPatientSurfaceName(const std::string& s) { this->patientSurfaceName = s; }
	
	/**
	* @brief Set function
	* Set the input pose Tpose in CoppeliaSim, to the object specified by the name obj_name, with respect to 
	* the object specified by the name ref_name. The port and can also be set (default are 19997 and simx_opmode_oneshot parameters)
	* @param obj_name: the name of the object that must be set in the scene
	* @param ref_name: the name of the object with respect to which the first object must be placed (if empty (""), world frame (-1) is assumed))
	* @param Tpose: the 4x4 homogeneous transformation matrix expressing the pose to be set
	* @param simport: the simulation port of the connection (default is 19997)
	* @param mode: the setting mode (default is simx_opmode_oneshot)
	* @return: return flag
	*/
	inline int setObjectPoseFromName(const char* obj_name, const char* ref_name, const Eigen::Matrix4f& Tpose, const int& simport = 19997, const int& mode = simx_opmode_oneshot) {
	
		// Set position
		int ret_p = setObjectPositionFromName(obj_name, ref_name, Tpose.block<3, 1>(0, 3), simport, mode);
	
		// Set orientation
		int ret_r = setObjectRotationMatrixFromName(obj_name, ref_name, Tpose.topLeftCorner(3, 3), simport, mode);

		return ret_p + ret_r;
	}

	/**
	* @brief Get function
	* Get the pose in CoppeliaSim of the object specified by the name obj_name, with respect to
	* the object specified by the name ref_name. The port and can also be set (default are 19997 and simx_opmode_oneshot parameters)
	* @param obj_name: the name of the object that must be set in the scene
	* @param ref_name: the name of the object with respect to which the first object must be placed (if empty (""), world frame (-1) is assumed))
	* @param simport: the simulation port of the connection (default is 19997)
	* @param mode: the setting mode (default is simx_opmode_oneshot)
	* @return the 4x4 homogeneous transformation matrix expressing the pose to be set
	*/
	inline Eigen::Matrix4f getObjectPoseFromName(const char* obj_name, const char* ref_name, const int& simport = 19997, const int& mode = simx_opmode_oneshot) {

		Eigen::Matrix4f T;
		T.setIdentity();

		// Set position
		Eigen::Vector3f p = getObjectPositionFromName(obj_name, ref_name, simport, mode);

		// Set orientation
		Eigen::Matrix3f R = getObjectOrientationFromName(obj_name, ref_name, simport, mode);

		T.topLeftCorner(3, 3) = R;
		T.block<3, 1>(0, 3) = p;
		return T;
	}


	/**
	* @brief Set function
	* Set the input position p in CoppeliaSim, to the object specified by the name obj_name, with respect to
	* the object specified by the name ref_name. The port and can also be set (default are 19997 and simx_opmode_oneshot parameters)
	* @param obj_name: the name of the object that must be set in the scene
	* @param ref_name: the name of the object with respect to which the first object must be placed (if empty (""), world frame (-1) is assumed))
	* @param p: the 3x1 vector expressing the position to be set
	* @param simport: the simulation port of the connection (default is 19997)
	* @param mode: the setting mode (default is simx_opmode_oneshot)
	* @return: return flag
	*/
	int setObjectPositionFromName(const char* obj_name, const char* ref_name, const Eigen::Vector3f& p, const int& simport = 19997, const int& mode = simx_opmode_oneshot);

	/**
	* @brief Set function
	* Set the input orientation R in CoppeliaSim, to the object specified by the name obj_name, with respect to
	* the object specified by the name ref_name. The port and can also be set (default are 19997 and simx_opmode_oneshot parameters)
	* @param obj_name: the name of the object that must be set in the scene
	* @param ref_name: the name of the object with respect to which the first object must be placed (if empty (""), world frame (-1) is assumed))
	* @param R: the 3x3 matrix expressing the orientation to be set
	* @param simport: the simulation port of the connection (default is 19997)
	* @param mode: the setting mode (default is simx_opmode_oneshot)
	* @return: return flag
	*/
	int setObjectRotationMatrixFromName(const char* obj_name, const char* ref_name, const Eigen::Matrix3f& R, const int& simport = 19997, const int& mode = simx_opmode_oneshot);


	/**
	* @brief Set function
	* Set the input orientation R in CoppeliaSim, to the object specified by the name obj_name, with respect to
	* the object specified by the name ref_name. The port and can also be set (default are 19997 and simx_opmode_oneshot parameters)
	* @param obj_name: the name of the object that must be set in the scene
	* @param ref_name: the name of the object with respect to which the first object must be placed (if empty (""), world frame (-1) is assumed))
	* @param abg: the 3x1 vector expressing the Euler angles to be set
	* @param simport: the simulation port of the connection (default is 19997)
	* @param mode: the setting mode (default is simx_opmode_oneshot)
	* @return: return flag
	*/
	int setObjectOrientationFromName(const char* obj_name, const char* ref_name, const Eigen::Vector3f& abg, const int& simport = 19997, const int& mode = simx_opmode_oneshot);


	/**
	* @brief Get function
	* Get the position p in CoppeliaSim of to the object specified by the name obj_name, with respect to
	* the object specified by the name ref_name. The port and can also be set (default are 19997 and simx_opmode_oneshot parameters)
	* @param obj_name: the name of the object that must be set in the scene
	* @param ref_name: the name of the object with respect to which the first object must be placed (if empty (""), world frame (-1) is assumed))
	* @param simport: the simulation port of the connection (default is 19997)
	* @param mode: the setting mode (default is simx_opmode_oneshot)
	* @return p: the 3x1 vector expressing the position to be set
	*/
	Eigen::Vector3f getObjectPositionFromName(const char* obj_name, const char* ref_name, const int& simport = 19997, const int& mode = simx_opmode_oneshot);

	/**
	* @brief Get function
	* Get the orientation R in CoppeliaSim of to the object specified by the name obj_name, with respect to
	* the object specified by the name ref_name. The port and can also be set (default are 19997 and simx_opmode_oneshot parameters)
	* @param obj_name: the name of the object that must be set in the scene
	* @param ref_name: the name of the object with respect to which the first object must be placed (if empty (""), world frame (-1) is assumed))
	* @param simport: the simulation port of the connection (default is 19997)
	* @param mode: the setting mode (default is simx_opmode_oneshot)
	* @return R: the 3x3 matrix expressing the orientation to be set
	*/
	Eigen::Matrix3f getObjectOrientationFromName(const char* obj_name, const char* ref_name, const int& simport = 19997, const int& mode = simx_opmode_oneshot);

	/*
	* @brief Collision check function
	* Check if the two input objects in the CoppeliaSim scene are colliding
	* @param obj1_name : the name of the first object
	* @param obj2_name : the name of the second object
	* @param simport : the simulation port of the connection(default is 19997)
	* @param mode : the setting mode(default is simx_opmode_oneshot)
	* @return true if the pair of objects is colliding, false otherwise
	*/
	bool checkObjectCollision(const char* obj1_name, const char* obj2_name, const int& simport = 19997, const int& mode = simx_opmode_oneshot);

	/*
	* @brief Collision check function
	* Check if the two input objects in the CoppeliaSim scene are colliding
	* @param obj1_name : the name of the first object
	* @param obj2_name : the name of the second object
	* @param simport : the simulation port of the connection(default is 19997)
	* @param mode : the setting mode(default is simx_opmode_oneshot)
	* @return the distance between the pair of objects 
	*/
	float checkObjectDistance(const char* obj1_name, const char* obj2_name, const int& simport = 19997, const int& mode = simx_opmode_oneshot);

	/**
	* @brief Set function
	* Set the input float value on the requested signal signalName
	* @param signalName: name of the signal
	* @param value: value to be set on the signal
	* @param simport : the simulation port of the connection(default is 19997)
	* @param mode : the setting mode(default is simx_opmode_oneshot)
	*
	*/
	void setFloatSignal(const char* signalName, const float& value, const int& simport = 19997, const int& mode = simx_opmode_oneshot);

	/*
	* @brief Add function
	* Add the virtual object specified by the input name objName to
	* the list simObjects of simulated objects in the CoppeliaSim scene
	* @param objName: the name of the object to be added
	* @param simport : the simulation port of the connection(default is 19997)
	* @param mode : the setting mode(default is simx_opmode_oneshot)
	* @return true if the object is present in the scene and is successfully added to the list
	*
	*/
	bool addSimObject(const char* objName, const int& simport = 19997, const int& mode = simx_opmode_oneshot);

	/**
	* @brief Set function
	* Set the parent-child relationship between the two specified input objects
	* @param childName: the child object
	* @param parentName: the parent object
	* @param simport : the simulation port of the connection(default is 19997)
	* @param mode : the setting mode(default is simx_opmode_oneshot)
	*
	*/
	void setChildObject(const char* childName, const char* parentName, const int& simport = 19997, const int& mode = simx_opmode_oneshot);


protected:

	int clientID;								//!< ID number of the V-REP Client remote API
	std::string IPaddr;							//!< IP address of the V-REP simulator server
	bool running;								//!< Flag stating if the simulation is running
	bool synchro;								//!< Flag stating if the simulation is perfectly synchronized
	bool readSimRealSensor;						//!< Flag stating if the measurements in the simulation should be taken from the simulated real optical sensor
	int activeToolHdl;							//!< V-REP handler of the tool currently in use from the tool list (see SystemProxyInterface)
	int polarisRefHdl;							//!< V-REP handler of the virtual Polaris sensor object in the simulated scene
	int polarisRefRealHdl;						//!< V-REP handler of the virtual Polaris sensor object in the simulated scene corresponding to the real polaris
	int CTscanOriginHdl;						//!< V-REP handler of the virtual Polaris sensor object in the simulated scene
	int desAntennaHdl;							//!< V-REP handler of the virtual desired antenna in the simulated scene
	int desAntennaAdjHdl;						//!< V-REP handler of the virtual desired antenna in the simulated scene for the adjustment task
	int panda_baseHdl;							//!< V-REP handler of the virtual robot base in the simulated scene
	int antennaHdl;								//!< V-REP handler of the virtual antenna in the simulated scene
	int forceSensorHdl;							//!< V-REP handler of the force sensor in the simulated scene
	int patientSkinHdl;							//!< V-REP handler of the patient skin object in the simulated scene
	std::vector <int> jointsHandle;				//!< V-REP handler array of the robot joints (PANDA)
	std::vector <int> ctpHandle;				//!< V-REP handler array of the CT landmark points
	std::vector <int> landHandle;				//!< V-REP handler array of the desired pose landmark points
	std::vector < std::string > graphNames;		//!< V-REP string names of the float signals representing the positioning error 
	std::vector < std::string > graphTauNames;	//!< V-REP string names of the float signals representing the tau
	std::vector < std::string > graphForceNames;//!< V-REP string names of the float signals representing the force
	std::vector < std::string > graphDeltaPr;	//!< V-REP string names of the float signals representing the deltaPr (in case of admittance control)

	int dummyNum;								//! Counter of the created dummy objects
											
	std::string desAntennaName;
	std::string patientFrameName;
	std::string patientSurfaceName;

	/**
	*@brief Verify if the sensor is properly connected to the system and ready for communication
	*/
	void checkConnection();

	std::map < std::string, int > simObjects;	//!< Map of <name,id> V-REP objects
	std::map < int, int > portIdMap;			//!< Map of <port,id> V-REP clients

};


#endif // VREP_PROXY_HPP_
