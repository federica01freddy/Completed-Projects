// Project Header files
#include "VREPProxy.hpp"
#include "Timer.hpp"
#include <cstdlib>

// Eigen Header files
#include <Eigen/Geometry>

/**
* @brief Default constructor of the VREPProxy class
*
*/
VREPProxy::VREPProxy() {

	// Initialize the member variables with default values
	this->clientID = -1;
	this->connected = false;
	this->running = false;
	this->IPaddr = std::string("1.1.1.1");
	this->activeToolHdl = -1;
	this->polarisRefHdl = -1; // if not changed, this corresponds to set poses wrt V-REP world frame
	this->polarisRefRealHdl = -1;
	this->CTscanOriginHdl = -1;
	this->desAntennaHdl = -1;
	this->jointsHandle = {-1, -1, -1, -1, -1, -1, -1};
	this->ctpHandle = { -1, -1, -1, -1};
	this->landHandle = { -1, -1, -1, -1, -1, -1 };
	this->dummyNum = 0;


	// Fill graph names
	graphNames.push_back("x_error");
	graphNames.push_back("y_error");
	graphNames.push_back("z_error");
	graphNames.push_back("a_error");
	graphNames.push_back("b_error");
	graphNames.push_back("g_error");


	graphTauNames.push_back("tau1");
	graphTauNames.push_back("tau2");
	graphTauNames.push_back("tau3");
	graphTauNames.push_back("tau4");
	graphTauNames.push_back("tau5");
	graphTauNames.push_back("tau6");
	graphTauNames.push_back("tau7");

	graphForceNames.push_back("forceX");
	graphForceNames.push_back("forceY");
	graphForceNames.push_back("forceZ");


	graphDeltaPr.push_back("deltaPr_x");
	graphDeltaPr.push_back("deltaPr_y");
	graphDeltaPr.push_back("deltaPr_z");
	graphDeltaPr.push_back("deltaPr_a");
	graphDeltaPr.push_back("deltaPr_b");
	graphDeltaPr.push_back("deltaPr_g");

	this->desAntennaName = "Antenna_base_des";
	this->patientFrameName = "_Phantom";

}

/**
* @brief Default destroyer of the VREPProxy class
*
*/
VREPProxy::~VREPProxy() {}


/**
* @brief Init function
* This function initializes the V-REP Remote APIs and opens the connection with the simulator
*/
void VREPProxy::init() {

	// Close eventual pending open communication channels
	simxFinish(-1);

	//!< Check and open a new connection to V-REP (timeout after 5s)
	this->checkConnection();

	if (this->isSystemConnected()) { // If successfully connected ...

		// Set synchronous communication mode (MF: DO WE REALLY NEED IT?)
		if (this->synchro)
			simxSynchronous(this->clientID, 1);
		else
			simxSynchronous(this->clientID, false);		
	}

	// Load V-REP Polaris handle
	simxGetObjectHandle(this->clientID, "PolarisRef", &(this->polarisRefHdl), simx_opmode_blocking);
	simxGetObjectHandle(this->clientID, "PolarisRef_real", &(this->polarisRefRealHdl), simx_opmode_blocking);

	// Load CT scan handle
	simxGetObjectHandle(this->clientID, this->patientFrameName.c_str(), &(this->CTscanOriginHdl), simx_opmode_blocking);
	//simxGetObjectHandle(this->clientID, "CT_frame", &(this->CTscanOriginHdl), simx_opmode_blocking);
	//simxGetObjectHandle(this->clientID, "Tool_2_ref_des", &(this->desAntennaHdl), simx_opmode_blocking);
	simxGetObjectHandle(this->clientID, this->desAntennaName.c_str(), &(this->desAntennaHdl), simx_opmode_blocking);
	simxGetObjectHandle(this->clientID, "Antenna_base_des_GrossPose", &(this->desAntennaAdjHdl), simx_opmode_blocking);
	simxGetObjectHandle(this->clientID, "Franka_base", &(this->panda_baseHdl), simx_opmode_blocking);
	simxGetObjectHandle(this->clientID, "Antenna_base", &(this->antennaHdl), simx_opmode_blocking);
	simxGetObjectHandle(this->clientID, "Franka_connection", &(this->forceSensorHdl), simx_opmode_blocking);
	simxGetObjectHandle(this->clientID, patientSurfaceName.c_str(), &(this->patientSkinHdl), simx_opmode_blocking);
	


	this->simObjects.insert({ "PolarisRef",this->polarisRefHdl });
	this->simObjects.insert({ "PolarisRef_real",this->polarisRefRealHdl });
	this->simObjects.insert({ this->patientFrameName.c_str(),this->CTscanOriginHdl});
	this->simObjects.insert({ this->desAntennaName.c_str(),this->desAntennaHdl });
	this->simObjects.insert({ "Antenna_base_des_GrossPose",this->desAntennaAdjHdl });
	this->simObjects.insert({ "Franka_base",this->panda_baseHdl });
	this->simObjects.insert({ "Antenna_base",this->antennaHdl });
	this->simObjects.insert({ "Franka_connection",this->forceSensorHdl });
	this->simObjects.insert({ this->patientSurfaceName.c_str(),this->patientSkinHdl});

	// Load joint handle (for PANDA robot)
	int nJoints = 7;
	for (int i = 0;i < nJoints;++i) {
		std::string name = "Franka_joint" + std::to_string(i+1);
		simxGetObjectHandle(this->clientID, name.c_str(), &(this->jointsHandle[i]), simx_opmode_blocking);
		this->simObjects.insert({ name.c_str(),this->jointsHandle[i] });
	}

	int nCtp = 4;
	for (int i = 0;i < nCtp;++i) {
		std::string name = "ctp_" + std::to_string(i + 1);
		simxGetObjectHandle(this->clientID, name.c_str(), &(this->ctpHandle[i]), simx_opmode_blocking);
		this->simObjects.insert({ name.c_str(),this->ctpHandle[i] });
	}

	int nLand = 6;
	std::string name = "MarkerOrigin_des";
	simxGetObjectHandle(this->clientID, name.c_str(), &(this->landHandle[0]), simx_opmode_blocking);
	this->simObjects.insert({ name.c_str(),this->landHandle[0] });
	for (int i = 1;i < nLand;++i) {
		std::string name = "Marker" + std::to_string(i) + "_des";
		simxGetObjectHandle(this->clientID, name.c_str(), &(this->landHandle[i]), simx_opmode_blocking);
		this->simObjects.insert({ name.c_str(),this->landHandle[i] });
	}
}

/**
* @brief Load function
* Load the tool identified by the input string on the corresponding system
* @param the string containing the path of the file corresponding to the tool to be loaded
*/
void VREPProxy::loadTool(const char* toolName,const int& simport) {

	int handle;
	std::string objectName;

	// Inspect the input file name and set the corresponding name of the V-REP object to be retrieved
	if (strstr(toolName, "338") != NULL) {
		objectName = std::string("Tool_1_ref");
	}
	else if (strstr(toolName, "339") != NULL) {	
		objectName = std::string("Tool_2_ref");
	}
	else if (strstr(toolName, "340") != NULL) {
		objectName = std::string("PassiveProbe_ref");
	}
	
#ifdef DEBUG
	std::cout << "Name of the V-REP Object: " << objectName << std::endl;
#endif

	// Call the corresponding remote V-REP API to retrieve the given object handle in V-REP
	simxGetObjectHandle(this->portIdMap[simport], objectName.c_str(), &handle, simx_opmode_blocking);

	// Set the found handle
	this->activeToolHdl = handle;

#ifdef DEBUG
	std::cout << "V-REP Object handle: " << this->activeToolHdl << std::endl;
#endif


}


/**
* @brief Set function
* Set the given pose of the currently tracked tool to the corresponding object in V-REP simulation
* @param the array containing the pose of the currently tracked tool
*/
void VREPProxy::setToolPose(const double* pose, const int& simport) {

	Eigen::Matrix4d Tpm0, Tm0m1, Tm1m0, Tpm1;
	Eigen::Quaterniond q0, q1;
	Eigen::Matrix3d R0, R1;
	Tpm0.setIdentity();
	Tpm1.setIdentity();
	Tm0m1.setIdentity();
	Tm1m0.setIdentity();

	Tm1m0 << 0.99596732854843, 0.043524533510208, -0.078452110290527, 0.012650072574615,
		-0.047620855271816, 0.99755638837814, -0.05112212523818, 6.0655176639557e-05,
		0.076035335659981, 0.054651919752359, 0.99560624361038, 0.013208627700806,
		0, 0, 0, 1;

	Tm0m1 = Tm1m0.inverse();


	// Define position array
	simxFloat position[3];
	for (int i = 0; i < 3; i++) position[i] = pose[i];
	
	// Define orientation array
	// NOTE: Polaris convention for quaternion representation is (w x y z), while V-REP convention is (x y z w)
	// See the assignments below
	
	simxFloat orientation[4];
	orientation[0] = pose[4];
	orientation[1] = pose[5];
	orientation[2] = pose[6];
	orientation[3] = pose[3];
	q0.coeffs() << orientation[0], orientation[1], orientation[2], orientation[3];
	R0 = q0.toRotationMatrix();
	Tpm0.topLeftCorner(3, 3) = R0;
	Tpm0(0, 3) = position[0];
	Tpm0(1, 3) = position[1];
	Tpm0(2, 3) = position[2];

	Tpm1 = Tpm0 * Tm0m1;
	R1 = Tpm1.topLeftCorner(3, 3);
	q1 = Eigen::Quaterniond(R1);

	/*position[0] = Tpm1(0, 3);
	position[1] = Tpm1(1, 3);
	position[2] = Tpm1(2, 3);

	orientation[0] = q1.x();
	orientation[1] = q1.y();
	orientation[2] = q1.z();
	orientation[3] = q1.w();//*/

	/*#ifdef DEBUG
	std::cout << "[VREP test] pose: " << pose[0] << ", " << pose[1] << ", " << pose[2] << ", " << pose[3] << ", " << pose[4] << ", " << pose[5] << ", " << pose[6] << "; " << std::endl;
	std::cout << "activeToolHdl: " << this->activeToolHdl << std::endl;
	std::cout << "polarisRefHdl: " << this->polarisRefHdl << std::endl;
#endif // DEBUG//*/

	// Set the position
	simxSetObjectPosition(this->portIdMap[simport], this->activeToolHdl, this->polarisRefHdl, position, simx_opmode_oneshot);

	// Set the orientation
	simxSetObjectQuaternion(this->portIdMap[simport], this->activeToolHdl, this->polarisRefHdl, orientation, simx_opmode_oneshot);

}



/**
* @brief Set function
* Set the pose of the Polaris camera in the V-REP scene, from the given input transformation matrix
* @param the transformation matrix Tctp
*/
void VREPProxy::setPolarisPose(const Eigen::Matrix4d& Tctp, const int& simport) {

	simxFloat position[3], wpose[3];
	simxFloat orientation[4];
	Eigen::Quaternionf q;
	Eigen::Matrix3f R;

	R = (Tctp.topLeftCorner(3, 3)).cast<float>();
	q = Eigen::Quaternionf(R);

	// Convert the position vector
	position[0] = Tctp(0, 3);
	position[1] = Tctp(1, 3);
	position[2] = Tctp(2, 3);

	// Convert the orientation vector
	orientation[0] = q.x();
	orientation[1] = q.y();
	orientation[2] = q.z();
	orientation[3] = q.w();

	// Set the Polaris pose
	simxSetObjectPosition(this->portIdMap[simport], this->polarisRefHdl, this->CTscanOriginHdl, position, simx_opmode_blocking);
	simxSetObjectQuaternion(this->portIdMap[simport], this->polarisRefHdl, this->CTscanOriginHdl, orientation, simx_opmode_blocking);
	
}


/**
* @brief Set function
* Set the pose of the Phantom camera in the V-REP scene, from the given input transformation matrix
* with respect to the specified refernce frame
* @param the transformation matrix Txct
* @param the reference frame of the transformation to be set
* @param simport the connecting port
*/
void VREPProxy::setPhantomPose(const Eigen::Matrix4d& Txct, const int& frame_ref, const int& simport) {

	simxFloat position[3], wpose[3];
	simxFloat orientation[4];
	Eigen::Quaternionf q;
	Eigen::Matrix3f R;

	R = (Txct.topLeftCorner(3, 3)).cast<float>();
	q = Eigen::Quaternionf(R);

	// Convert the position vector
	position[0] = Txct(0, 3);
	position[1] = Txct(1, 3);
	position[2] = Txct(2, 3);

	// Convert the orientation vector
	orientation[0] = q.x();
	orientation[1] = q.y();
	orientation[2] = q.z();
	orientation[3] = q.w();

	int refHdl = (frame_ref == 0) ? (this->panda_baseHdl) : (this->polarisRefHdl);

	// Set the Polaris pose
	simxSetObjectPosition(this->portIdMap[simport], this->CTscanOriginHdl, refHdl, position, simx_opmode_blocking);
	simxSetObjectQuaternion(this->portIdMap[simport], this->CTscanOriginHdl, refHdl, orientation, simx_opmode_blocking);

}



/**
* @brief Set function
* Set the pose of the desired antenna in the V-REP scene, from the given input vector
* @param the 7D pose vector
*/
void VREPProxy::setAntennaDesPose(const Eigen::Matrix<double, 7, 1>& pose) {


	simxFloat position[3];
	simxFloat quaternion[4];

	// Get position
	position[0] = pose(0);
	position[1] = pose(1);
	position[2] = pose(2);

	// Get quaternion
	quaternion[0] = pose(0 + 3);
	quaternion[1] = pose(1 + 3);
	quaternion[2] = pose(2 + 3);
	quaternion[3] = pose(3 + 3);


/*#ifdef DEBUG
	std::cout << "[VREP test] antenna des pose: " << position[0] << ", " << position[1] << ", " << position[2] << ", " << quaternion[0] << ", " << quaternion[1] << ", " << quaternion[2] << ", " << quaternion[3] << "; " << std::endl;
	std::cout << "activeToolHdl: " << this->activeToolHdl << std::endl;
	std::cout << "polarisRefHdl: " << this->polarisRefHdl << std::endl;
#endif // DEBUG//*/


	
	// Set the position on V-REP
	simxSetObjectPosition(this->clientID, this->desAntennaHdl, this->polarisRefHdl, position, simx_opmode_blocking);

	// Set the orientation on V-REP
	simxSetObjectQuaternion(this->clientID, this->desAntennaHdl, this->polarisRefHdl, quaternion, simx_opmode_blocking);
}


/**
* @brief Set function
* Set the pose of the desired antenna in the V-REP scene, from the given homogeneous transformation matrx
* @param the 4x4 homogeneous transformation matrix
*/
void VREPProxy::setAntennaDesPose(const Eigen::Matrix4d& Tpm_, const int& simport) {

	simxFloat position[3], wpose[3];
	simxFloat orientation[4];
	Eigen::Quaternionf q;
	Eigen::Matrix3f R;

	R = (Tpm_.topLeftCorner(3, 3)).cast<float>();
	q = Eigen::Quaternionf(R);

	// Convert the position vector
	position[0] = Tpm_(0, 3);
	position[1] = Tpm_(1, 3);
	position[2] = Tpm_(2, 3);

	// Convert the orientation vector
	orientation[0] = q.x();
	orientation[1] = q.y();
	orientation[2] = q.z();
	orientation[3] = q.w();

	// Set the Polaris pose
	simxSetObjectPosition(this->portIdMap[simport], this->desAntennaHdl, this->polarisRefHdl, position, simx_opmode_blocking);
	simxSetObjectQuaternion(this->portIdMap[simport], this->desAntennaHdl, this->polarisRefHdl, orientation, simx_opmode_blocking);
}


/**
* @brief Get function
* Get the pose of the desired antenna from the V-REP scene
* @param the 4x4 homogeneous transformation matrix
* @param string indicating to which object the pose must be expressed
* @param flag stating if the desired pose is for the "adjustment" task
*/
void VREPProxy::setAntennaDesPose(Eigen::Matrix4d& Tdes, const std::string& ref, const bool& poseAdj) {

	int handleRef = -1;	//world frame handle
	if (ref.compare("POLARIS") == 0) {
		handleRef = this->polarisRefHdl;
	}
	else if (ref.compare("panda_base") == 0) {
		handleRef = this->panda_baseHdl;
	}

	simxFloat position[3];
	simxFloat orientation[4];
	Eigen::Quaternionf q;
	Eigen::Matrix3f R;

	R = (Tdes.topLeftCorner(3, 3)).cast<float>();
	q = Eigen::Quaternionf(R);

	// Convert the position vector
	position[0] = Tdes(0, 3);
	position[1] = Tdes(1, 3);
	position[2] = Tdes(2, 3);

	// Convert the orientation vector
	orientation[0] = q.x();
	orientation[1] = q.y();
	orientation[2] = q.z();
	orientation[3] = q.w();

	// Set the pose
	int handle;
	if (poseAdj == true)
		handle = this->desAntennaAdjHdl;
	else
		handle = this->desAntennaHdl;
	simxSetObjectPosition(this->clientID, handle, handleRef, position, simx_opmode_blocking);
	simxSetObjectQuaternion(this->clientID, handle, handleRef, orientation, simx_opmode_blocking);
}


/**
* @brief Get function
* Get the pose of the desired antenna from the V-REP scene
* @param the 4x4 homogeneous transformation matrix
* @param string indicating to which object the pose must be expressed
* @param int for the reading mode
* @param flag stating if the desired pose is for the "adjustment" task
*/
void VREPProxy::getAntennaDesPose(Eigen::Matrix4d& pose_des, const std::string& ref, int simx_opmod, const bool& poseAdj)
{
	int handleRef = -1;	//world frame handle
	if (ref.compare("POLARIS")==0){
		handleRef = this->polarisRefHdl;
	}
	else if (ref.compare("panda_base")==0) {
		handleRef = this->panda_baseHdl;
	}

	//reading pose from Vrep scene
	simxFloat position[3];
	simxFloat quaternion[4];

	int handle;
	if (poseAdj == true)
		handle = this->desAntennaAdjHdl;
	else
		handle = this->desAntennaHdl;
	simxGetObjectPosition(this->clientID, handle, handleRef, position, simx_opmod);
	simxGetObjectQuaternion(this->clientID, handle, handleRef, quaternion, simx_opmod);

	//assinging pose
	pose_des(0, 3) = position[0];
	pose_des(1, 3) = position[1];
	pose_des(2, 3) = position[2];
	Eigen::Quaternionf q_eigen{quaternion};
	Eigen::Matrix3d R{(q_eigen.normalized().toRotationMatrix()).cast<double>()};
	pose_des.topLeftCorner(3, 3)= R;
}

/**
* @brief Get function
* Get the pose of the desired antenna from the V-REP scene
* @param the 4x4 homogeneous transformation matrix
* @param string indicating to which object the pose must be expressed
*/
void VREPProxy::getAntennaPose(Eigen::Matrix4d& pose, const std::string& ref, int simx_opmode) {

	int handleRef = -1;	//world frame handle
	if (ref.compare("POLARIS") ==0 ) {
		handleRef = this->polarisRefHdl;
		//std::cout << handleRef << '\n';
		//std::cout << "Getting the desired pose in the Polaris reference frame\n";
	}

	else if (ref.compare("panda_base") == 0) {
		handleRef = this->panda_baseHdl;
		//std::cout << handleRef << '\n';
		//std::cout << "Getting the desired pose in the Panda base reference frame\n";
	}

	//reading pose from Vrep scene
	simxFloat position[3];
	simxGetObjectPosition(this->clientID, this->antennaHdl, handleRef, position, simx_opmode);
	simxFloat quaternion[4];
	simxGetObjectQuaternion(this->clientID, this->antennaHdl, handleRef, quaternion, simx_opmode);
	
	// Before disconnecting from CoppeliaSim, make sure to disable the streamings you previously enabled:
	
	//simxGetObjectPosition(this->clientID, this->antennaHdl, handleRef, position, simx_opmode_discontinue);

	//simxGetPingTime(clientID, &pingTime); // needed to insure that above reaches CoppeliaSim before disconnection

	//assinging pose
	pose.setIdentity();
	pose(0, 3) = position[0];
	pose(1, 3) = position[1];
	pose(2, 3) = position[2];
	Eigen::Quaternionf q_eigen{ quaternion };
	Eigen::Matrix3d R{ (q_eigen.normalized().toRotationMatrix()).cast<double>() };
	pose.topLeftCorner(3, 3) = R;

}


/**
* @brief Get function
* Get the pose of the robot base from the V-REP scene
* @param the 4x4 homogeneous transformation matrix
* @param string indicating to which object the pose must be expressed
*/
void VREPProxy::getRobotBasePose(Eigen::Matrix4d& pose, const std::string& ref, int simx_opmode) {

	int handleRef = -1;	//world frame handle
	if (ref.compare("POLARIS") == 0) {
		handleRef = this->polarisRefHdl;
		//std::cout << handleRef << '\n';
		//std::cout << "Getting the desired pose in the Polaris reference frame\n";
	}
	else if (ref.compare("panda_base") == 0) {
		handleRef = this->panda_baseHdl;
		//std::cout << handleRef << '\n';
		//std::cout << "Getting the desired pose in the Panda base reference frame\n";
	}
	//reading pose from Vrep scene
	simxFloat position[3];
	simxGetObjectPosition(this->clientID, this->panda_baseHdl, handleRef, position, simx_opmode);
	simxFloat quaternion[4];
	simxGetObjectQuaternion(this->clientID, this->panda_baseHdl, handleRef, quaternion, simx_opmode);

	//assinging pose
	pose.setIdentity();
	pose(0, 3) = position[0];
	pose(1, 3) = position[1];
	pose(2, 3) = position[2];
	Eigen::Quaternionf q_eigen{ quaternion };
	Eigen::Matrix3d R{ (q_eigen.normalized().toRotationMatrix()).cast<double>() };
	pose.topLeftCorner(3, 3) = R;
}


/**
* @brief Get function
* Get the pose of the ee w.r.t. the last robot frame (which is the forse sensor frame in case of Panda robot) from the V-REP scene
* @param pose: position and orientation of the end-effector w.r.t. the last robot frame
*/
void VREPProxy::getTeeOffset(Eigen::Matrix4d& pose) {
	pose.setIdentity();
	//vrepp.getObjectPose(pose)
	//reading pose from Vrep scene
	simxFloat position[3];
	simxGetObjectPosition(this->clientID, this->antennaHdl, this->forceSensorHdl, position, simx_opmode_blocking);
	simxFloat quaternion[4];
	simxGetObjectQuaternion(this->clientID, this->antennaHdl, this->forceSensorHdl, quaternion, simx_opmode_blocking);
	//assinging pose
	pose.setIdentity();
	pose(0, 3) = position[0];
	pose(1, 3) = position[1];
	pose(2, 3) = position[2];
	Eigen::Quaternionf q_eigen{ quaternion };
	Eigen::Matrix3d R{ (q_eigen.normalized().toRotationMatrix()).cast<double>() };
	pose.topLeftCorner(3, 3) = R;
}


/**
* @brief Get function
* Get the pose of the probe object from the V-REP scene w.r.t. polaris frame
*/
void VREPProxy::getProbePose(double* pose) {
	//reading pose from Vrep scene
	int handle;
	if (this->readSimRealSensor)
		handle = this->polarisRefRealHdl;
	else
		handle = this->polarisRefHdl;

	simxFloat position[3];
	simxGetObjectPosition(this->clientID, this->activeToolHdl, handle, position, simx_opmode_buffer);
	//simxGetObjectPosition(this->clientID, this->probeHdl, -1, position, simx_opmode_buffer);

	simxFloat quaternion[4];
	simxGetObjectQuaternion(this->clientID, this->activeToolHdl, handle, quaternion, simx_opmode_buffer);
//	simxGetObjectQuaternion(this->clientID, this->probeHdl, -1, quaternion, simx_opmode_buffer);

	for (int i = 0; i < 3;++i) {
		pose[i] = position[i];
		pose[i + 3] = quaternion[i];
	}
	pose[6] = quaternion[3];

}

/**
* @brief Set function
* Set the pose of the probe object from the V-REP scene
*@param pose: the pose of the probe
*/
void VREPProxy::setProbePose(double* pose) {
	Eigen::Matrix4d Tpm0, Tm0m1, Tm1m0, Tpm1;
	Eigen::Quaterniond q0, q1;
	Eigen::Matrix3d R0, R1;
	Tpm0.setIdentity();
	Tpm1.setIdentity();
	Tm0m1.setIdentity();
	Tm1m0.setIdentity();

	Tm1m0 << 0.99596732854843, 0.043524533510208, -0.078452110290527, 0.012650072574615,
		-0.047620855271816, 0.99755638837814, -0.05112212523818, 6.0655176639557e-05,
		0.076035335659981, 0.054651919752359, 0.99560624361038, 0.013208627700806,
		0, 0, 0, 1;

	Tm0m1 = Tm1m0.inverse();


	// Define position array
	simxFloat position[3];
	for (int i = 0; i < 3; i++) position[i] = pose[i];

	// Define orientation array
	// NOTE: Polaris convention for quaternion representation is (w x y z), while V-REP convention is (x y z w)
	// See the assignments below

	simxFloat orientation[4];
	orientation[0] = pose[3];
	orientation[1] = pose[4];
	orientation[2] = pose[5];
	orientation[3] = pose[6];
	q0.coeffs() << orientation[0], orientation[1], orientation[2], orientation[3];
	R0 = q0.toRotationMatrix();
	Tpm0.topLeftCorner(3, 3) = R0;
	Tpm0(0, 3) = position[0];
	Tpm0(1, 3) = position[1];
	Tpm0(2, 3) = position[2];

	Tpm1 = Tpm0 * Tm0m1;
	R1 = Tpm1.topLeftCorner(3, 3);
	q1 = Eigen::Quaterniond(R1);

	/*position[0] = Tpm1(0, 3);
	position[1] = Tpm1(1, 3);
	position[2] = Tpm1(2, 3);

	orientation[0] = q1.x();
	orientation[1] = q1.y();
	orientation[2] = q1.z();
	orientation[3] = q1.w();//*/

	/*#ifdef DEBUG
	std::cout << "[VREP test] pose: " << pose[0] << ", " << pose[1] << ", " << pose[2] << ", " << pose[3] << ", " << pose[4] << ", " << pose[5] << ", " << pose[6] << "; " << std::endl;
	std::cout << "activeToolHdl: " << this->activeToolHdl << std::endl;
	std::cout << "polarisRefHdl: " << this->polarisRefHdl << std::endl;
	#endif // DEBUG//*/


	int handle;
	if (this->readSimRealSensor)
		handle = this->polarisRefRealHdl;
	else
		handle = this->polarisRefHdl;

	// Set the position
	simxSetObjectPosition(this->clientID, this->activeToolHdl, handle, position, simx_opmode_oneshot);

	// Set the orientation
	simxSetObjectQuaternion(this->clientID, this->activeToolHdl, handle, orientation, simx_opmode_oneshot);
}

/**
* @brief Get function
* Get the joint position from the V-REP scene
* @param configuration vector q [out]
* @param simport the communication port
* @param simx_opmode the communication mode
*/
void VREPProxy::getJointPosition(Eigen::VectorXd& q, const int& simport, const int& simx_opmode){
	//iterate over the joint handles
	simxFloat *qf = new simxFloat[q.size()];
	for (int i = 0;i < this->jointsHandle.size();++i) {
		simxGetJointPosition(this->portIdMap[simport], this->jointsHandle[i], &qf[i], simx_opmode);
		q[i] = qf[i];
	}
	//release memory
	delete[] qf;
}

/**
* @brief Get function
* Get the joint velocity from the V-REP scene
* @param configuration vector dq
* @param simport the communication port
* @param simx_opmode the communication mode

*/
void VREPProxy::getJointVelocity(Eigen::VectorXd & dq, const int& simport, const int& simx_opmode) {
	//iterate over the joint handles
	simxFloat *dqf = new simxFloat[dq.size()];
	//simxFloat dqf[7];
	for (int i = 0;i < this->jointsHandle.size();++i) {
		simxGetObjectFloatParameter(this->portIdMap[simport], this->jointsHandle[i], 2012, &dqf[i], simx_opmode);
		dq[i] = dqf[i];
	}
	//release memory
	delete[] dqf;
}

/**
* @brief Get function
* Get the joint torque from the V-REP scene
* @param tau vector
* @param simport the communication port
* @param simx_opmode the communication mode
*/
void VREPProxy::getJointTorque(Eigen::VectorXd & tau, const int& simport, const int& simx_opmode) {
	//iterate over the joint handles
	simxFloat *tauf = new simxFloat[tau.size()];

	//simxFloat tauf[7];
	for (int i = 0;i < this->jointsHandle.size();++i) {
		simxGetJointForce(this->portIdMap[simport], this->jointsHandle[i], &tauf[i], simx_opmode);
		tau[i] = tauf[i];
	}
	//release memory
	delete[] tauf;
}

/**
* @brief Get function
* Get the antenna velocity from the V-REP scene (W.R.T. WORLD FRAME!!)
* @param antenna velocity
* @param simx_opmode: opmode of the Vrepp call
*/

void VREPProxy::getAntennaVelocity(Eigen::VectorXd& eeV, int simx_opmode) {
	simxFloat v[3];
	simxFloat a[3];
	simxGetObjectVelocity(this->clientID,this->antennaHdl, v, a, simx_opmode);
	eeV(0) = v[0];
	eeV(1) = v[1];
	eeV(2) = v[2];
	eeV(3) = a[0];
	eeV(4) = a[1];
	eeV(5) = a[2];
}

/**
* @brief Get function
* Get the robot pose from the V-REP scene
* @param transformation matrix Twr
* TO DO: parametrization
*/
void VREPProxy::getRobotPose(Eigen::Matrix4d& Twr) {
	//float *eulerAngles;
	//simxGetObjectOrientation(this->clientID,this->panda_base,-1,eulerAngles,simx_opmode)
	Twr.setIdentity();
	Twr(0, 0) = -1; //x
	Twr(1, 1) = -1; //y

	Twr(0, 3) = +4.2434e-02;
	Twr(1, 3) = +5.7864e-04;
	Twr(2, 3) = -6.9950e-02;
}

/**
* @brief Get function
* Get the force sensor measure from the V-REP scene
* @param force vector
*/
void VREPProxy::getForceMsr(Eigen::VectorXd & forceMsr, int simx_opmode) {
	simxFloat force[3];
	simxFloat torque[3];
	unsigned char *state = nullptr;
	
	simxReadForceSensor(this->clientID, this->forceSensorHdl, state, force, torque, simx_opmode);

	// Check if the sensor data is available (state variable is always null....)
	if (abs(force[0]) > 1e6)
		forceMsr.setZero();
	else {
		forceMsr(0) = force[0];
		forceMsr(1) = force[1];
		forceMsr(2) = force[2];
		forceMsr(3) = torque[0];
		forceMsr(4) = torque[1];
		forceMsr(5) = torque[2];
	}
}


/**
* @brief Set function
* Set the joint position in the V-REP scene
* @param configuration vector q
*/
void VREPProxy::setJointPosition(const Eigen::VectorXd& q, const int& simport, int simx_opmode) {

	//iterate over the joint handles
	for (int i = 0;i < this->jointsHandle.size();++i) {
		//simxSetJointPosition(this->clientID, this->jointsHandle[i], q[i], simx_opmode);
		simxSetJointPosition(this->portIdMap[simport], this->jointsHandle[i], q(i), simx_opmode);
	}
}



/**
* @brief Set function
* Set the target joint position in the V-REP scene
* @param configuration vector q
*/
void VREPProxy::setJointTargetPosition(Eigen::VectorXd& q, const int& simport, const int& simx_opmode) {
	//iterate over the joint handles
	for (int i = 0;i < this->jointsHandle.size();++i) {
		simxSetJointTargetPosition(this->portIdMap[simport], this->jointsHandle[i], q[i], simx_opmode);
	}
}

/**
* @brief Set function
* Set the joint target velocity in the V-REP scene
* @param velocity vector dq
*/
//void VREPProxy::setJointTargetVelocity(Eigen::VectorXd& dq) {
void VREPProxy::setJointTargetVelocity(const Eigen::VectorXd & dq, const int& simport, const int& simx_opmode) {
	//iterate over the joint handles
	for (int i = 0;i < this->jointsHandle.size();++i) {
		simxSetJointTargetVelocity(this->portIdMap[simport], this->jointsHandle[i], dq[i], simx_opmode);
	}
}

/**
* @brief Set function
* Set the joint torque in the V-REP scene
* @param torque vector
* @param simport: the simulation port for the V-REP connection
* @param simx_opmode: mode of connection
*/
void VREPProxy::setJointTorque(const Eigen::VectorXd& tau, const int& simport, int simx_opmode) {

	//iterate over the joint handles
	for (int i = 0; i < this->jointsHandle.size(); ++i) {
		simxSetJointMaxForce(this->portIdMap[simport], this->jointsHandle[i], abs(tau[i]), simx_opmode_oneshot);
		if (tau[i] >= 0) {
			//simxSetJointTargetPosition(this->portIdMap[simport], this->jointsHandle[i], 1e3, simx_opmode_oneshot); // if CoppeliaSim joint control loop is enabled for this joint
			simxSetJointTargetVelocity(this->portIdMap[simport], this->jointsHandle[i], 10e10, simx_opmode_oneshot); // if CoppeliaSim joint control loop is NOT enabled for this joint
		}
		else {
			//simxSetJointTargetPosition(this->portIdMap[simport], this->jointsHandle[i], -1e3, simx_opmode_oneshot); // if CoppeliaSim joint control loop is enabled for this joint
			simxSetJointTargetVelocity(this->portIdMap[simport], this->jointsHandle[i], -10e10, simx_opmode_oneshot); // if CoppeliaSim joint control loop is NOT enabled for this joint
		}

	}
}


/**
* @brief Get function
* Get the position of the V-REP object corresponding to the currently tracked tool
* @param [output] the array filled with the position of the currently tracked tool
*/
void VREPProxy::getToolPosition(simxFloat* position) {

	// Retrieve the currently tracked object position in V-REP
	simxGetObjectPosition(this->clientID, this->activeToolHdl, this->polarisRefHdl, position, simx_opmode_blocking);


}




/**
* @brief Close function
* This function closes the V-REP Remote APIs and the connection with the simulator
*/
void VREPProxy::close() {

	// Call the corresponding remote V-REP API to close the communication with V-REP
	simxFinish(this->clientID);

}

/**
* @brief Start simulation function
* Play the simulation in the currently opened V-REP scene
*/
void VREPProxy::startSim(const int& simport) {

	// Call the corresponding remote V-REP API to start the simulation
	simxStartSimulation(this->portIdMap[simport], simx_opmode_blocking);

	///Preoperative instructions for reading functions
	//REGISTRATION AND DESIRED POSE ROUTINES
	simxFloat p[3];
	simxFloat quat[4];
	int handle;
	if (this->readSimRealSensor)
		handle = this->polarisRefRealHdl;
	else
		handle = this->polarisRefHdl;
	simxGetObjectPosition(this->portIdMap[simport], this->activeToolHdl, handle, p, simx_opmode_streaming);
	simxGetObjectQuaternion(this->portIdMap[simport], this->activeToolHdl, handle, quat, simx_opmode_streaming);

	// Set running flag on true
	this->setRunning(true);
}

/**
* @brief Stop simulation function
* Stop the simulation in the currently opened V-REP scene
*/
void VREPProxy::stopSim(const int& simport) {

	// Call the corresponding remote V-REP API to stop the simulation
	simxStopSimulation(this->portIdMap[simport], simx_opmode_blocking);


}

/**
*@brief Verify if the sensor is properly connected to the system and ready for communication
*/
void VREPProxy::checkConnection() {

	this->portIdMap.insert({ 19997, -1 });
	this->portIdMap.insert({ 19996, -1 });
	this->portIdMap.insert({ 19995, -1 });

	std::map< int, int >::iterator it;
	bool avail = true;
	for (it = this->portIdMap.begin(); it != this->portIdMap.end(); ++it) {
		it->second = simxStart((simxChar*)this->IPaddr.c_str(), it->first, true, true, 50, 5);
		if (it->second != -1) {
			std::cout << " V-REP simulator at port " << it->first << "is successfully connected!" << std::endl;
			this->connected = true;
		}
		else {
			std::cout << "Could not connect to V-REP at port " << it->first << ".Check the V - REP settings... " << std::endl;
			this->connected = false;
		}
	}


	// Default client
	this->clientID = (this->portIdMap.begin())->second;
	
}


/**
* @param Check function
* Wait for the V-REP simulation  to end
* @return a id code
*/
int VREPProxy::waitForSimulationEnded() {

	int info = -1;

	/*while (info != 5) {
	
		// Wait for simulation stop
		simxGetInMessageInfo(this->clientID, simx_headeroffset_server_state, &info);
	
#ifdef DEBUG
		std::cout << "info: " << info << std::endl;
#endif //DEBUG
	}//*/


	return info;

}



/**
* @brief Show function
* Show the input point in the simulated scene as a dummy object
* @param the 3D coordinates of the given point, in the vision sensor frame
*/
void VREPProxy::showPoint(const Eigen::Vector3d& p, const int& frame_ref, const int& simport) {

	simxFloat pos[3];
	simxInt dummyHandle;

	pos[0] = p(0);
	pos[1] = p(1);
	pos[2] = p(2);

	int refHdl = (frame_ref == 0) ? (this->panda_baseHdl) : (this->polarisRefHdl);

	// Create the dummy
	simxCreateDummy(this->portIdMap[simport], 0.005, NULL, &dummyHandle, simx_opmode_blocking);

	// Set position of the dummy
	simxSetObjectPosition(this->portIdMap[simport], dummyHandle, refHdl, pos, simx_opmode_blocking);
	
}


/**
* @brief Show function
* Show the input reference frame in the simulated scene as a dummy object
* @param T: the 4x4 homogeneous transformation matrix representing the desired reference frame
*/
void VREPProxy::showFrame(const Eigen::Matrix4d& T, const simxUChar* color, const int& simport) {

	simxFloat pos[3], ori[3], quat[4];
	simxInt dummyHandle;
	Eigen::Matrix3d R;
	Eigen::Quaterniond qeig;

	pos[0] = T(0, 3);
	pos[1] = T(1, 3);
	pos[2] = T(2, 3);

	R = T.topLeftCorner(3, 3);
	qeig = Eigen::Quaterniond(R);
	quat[0] = qeig.x();
	quat[1] = qeig.y();
	quat[2] = qeig.z();
	quat[3] = qeig.w();

	// Create the dummy
	simxCreateDummy(this->portIdMap[simport], 0.01, color, &dummyHandle, simx_opmode_blocking);

	// Set position of the dummy
	simxSetObjectPosition(this->portIdMap[simport], dummyHandle, this->panda_baseHdl, pos, simx_opmode_blocking);

	// Set orientation of the dummy
	simxSetObjectQuaternion(this->portIdMap[simport], dummyHandle, this->panda_baseHdl, quat, simx_opmode_blocking);

}


/**
* @brief Get function
* Get the position of the CT landmarks
* @return: 4x3 matrix of position vectors
*/
Eigen::MatrixXf VREPProxy::getCTPoints() {
	int nCtps = 4;
	Eigen::MatrixXf ctps(nCtps, 3);
	simxFloat p[3];
	for (int i = 0; i < nCtps;++i) {
		simxGetObjectPosition(this->clientID, this->ctpHandle[i], this->CTscanOriginHdl, p, simx_opmode_blocking);
		//simxGetObjectPosition(this->clientID, this->ctpHandle[i], -1, p, simx_opmode_blocking);
		for (int j = 0; j < 3;++j){
			ctps(i, j) = p[j];
		}
	}
	return ctps;
}

/**
* @brief Get function
* Get the position of the CT landmarks
* @return: 4x3 matrix of position vectors
*/
Eigen::MatrixXf VREPProxy::getCTPointsPolaris() {
	int nCtps = 4;
	Eigen::MatrixXf ctps(nCtps, 3);
	simxFloat p[3];
	for (int i = 0; i < nCtps;++i) {
		simxGetObjectPosition(this->clientID, this->ctpHandle[i], this->polarisRefRealHdl, p, simx_opmode_blocking);
		//simxGetObjectPosition(this->clientID, this->ctpHandle[i], -1, p, simx_opmode_blocking);
		for (int j = 0; j < 3;++j) {
			ctps(i, j) = p[j];
		}
	}
	return ctps;
}

/**
* @brief Get function
* Get the position of the desired landmarks of the desired antenna configuration 
* @return: 4x3 matrix of position vectors
*/
Eigen::MatrixXf VREPProxy::getDesPosLandmarks(int numPoints) {
	Eigen::MatrixXf landmarks(numPoints, 3);
	simxFloat p[3];
	for (int i = 0; i < numPoints;++i) {
		simxGetObjectPosition(this->clientID, this->landHandle[i], this->polarisRefHdl, p, simx_opmode_blocking);
		for (int j = 0; j < 3;++j) {
			landmarks(i, j) = p[j];
		}
	}
	return landmarks;
}

/**
* @brief Send function
* Send the error positionining signals on V-REP
* @param error the error position vector
*/
void VREPProxy::sendErrorSignals(const Eigen::Matrix<double, 6, 1>& error, float det_JJT) {

	for (int i = 0; i < 6; i++) {
		double err = error(i);
		if (i >= 3)
			err = err *(180 / 3.14);
		simxInt ret = simxSetFloatSignal(this->clientID, (this->graphNames[i]).c_str(), error(i), simx_opmode_oneshot);
	}
	simxSetFloatSignal(this->clientID, "det_JJT", det_JJT, simx_opmode_oneshot);
}

/**
* @brief Send function
* Send the configuration signals on V-REP
* @param signal vector
*/
void VREPProxy::sendSignals(const Eigen::VectorXd& s, std::string& type) {
	std::vector<std::string> graphs;
	if (type.compare("tauDiff") == 0 || type.compare("tau_model") == 0 || type.compare("tau_meas") == 0)
		graphs = this->graphTauNames;
	else if (type.compare("forceMsr") == 0 || type.compare("forceDes") == 0)
		graphs = this->graphForceNames;
	else if (type.compare("deltaPr") == 0)
		graphs = this->graphDeltaPr;

	int length = s.size();
	for (int i = 0; i < length; i++) {
		if (type.compare("tau_model") == 0)
			simxInt ret = simxSetFloatSignal(this->clientID, graphs[i].append("_model").c_str(), s(i), simx_opmode_oneshot);
		else if (type.compare("tau_meas") == 0)
			simxInt ret = simxSetFloatSignal(this->clientID, graphs[i].append("_meas").c_str(), s(i), simx_opmode_oneshot);
		else if (type.compare("tauDiff") == 0)
			simxInt ret = simxSetFloatSignal(this->clientID, graphs[i].c_str(), s(i), simx_opmode_oneshot);
		else if (type.compare("forceMsr") == 0)
			simxInt ret = simxSetFloatSignal(this->clientID, graphs[i].append("_measured_(N)").c_str(), s(i), simx_opmode_oneshot);
		else if (type.compare("forceDes") == 0)
			simxInt ret = simxSetFloatSignal(this->clientID, graphs[i].append("_desired_(N)").c_str(), s(i), simx_opmode_oneshot);
		else if (type.compare("deltaPr") == 0)
			simxInt ret = simxSetFloatSignal(this->clientID, graphs[i].c_str(), s(i), simx_opmode_oneshot);
	}
}




/**
*@brief Error Connection Message of the sensor
*@return the message string
*/
char* VREPProxy::errorConnectionMessage() {


	return "[V-REP] V-REP not detected. Cannot run the required functionalities.";

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
int VREPProxy::setObjectPositionFromName(const char* obj_name, const char* ref_name, const Eigen::Vector3f& p, const int& simport, const int& mode) {

	int ret = -1;
	int objHandle, refHandle;

	objHandle = this->simObjects[obj_name];
	refHandle = (!std::string(ref_name).empty()) ? this->simObjects[ref_name] : -1;

	std::cout << "obj_name = " << obj_name << std::endl;
	std::cout << "objHandle = " << objHandle << std::endl;
	std::cout << "p = " << p.transpose() << std::endl;
	std::cout << std::endl;

	ret = simxSetObjectPosition(this->portIdMap[simport], objHandle, refHandle, &p(0), mode);

	return ret;

}

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
int VREPProxy::setObjectRotationMatrixFromName(const char* obj_name, const char* ref_name, const Eigen::Matrix3f& R, const int& simport, const int& mode) {

	int ret = -1;
	int objHandle, refHandle;
	Eigen::Quaternionf q(R);
	
	objHandle = this->simObjects[obj_name];
	refHandle = (!std::string(ref_name).empty()) ? this->simObjects[ref_name] : -1;

	// q.coeffs() should have been stored in the order x, y, z, w, that should be the same as CoppeliaSim
	ret = simxSetObjectQuaternion(this->portIdMap[simport], objHandle, refHandle, &q.coeffs()(0), mode);

	return ret;

}


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
int VREPProxy::setObjectOrientationFromName(const char* obj_name, const char* ref_name, const Eigen::Vector3f& abg, const int& simport, const int& mode) {

	int ret = -1;
	int objHandle, refHandle;

	objHandle = this->simObjects[obj_name];
	refHandle = (!std::string(ref_name).empty()) ? this->simObjects[ref_name] : -1;

	// q.coeffs() should have been stored in the order x, y, z, w, that should be the same as CoppeliaSim
	ret = simxSetObjectOrientation(this->portIdMap[simport], objHandle, refHandle, &abg(0), mode);

	return ret;

}

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
Eigen::Vector3f VREPProxy::getObjectPositionFromName(const char* obj_name, const char* ref_name, const int& simport, const int& mode) {

	Eigen::Vector3f p;

	int objHandle, refHandle;

	objHandle = this->simObjects[obj_name];
	refHandle = (!std::string(ref_name).empty()) ? this->simObjects[ref_name] : -1;

	simxGetObjectPosition(this->portIdMap[simport], objHandle, refHandle, &p(0), mode);

	return p;


}

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
Eigen::Matrix3f VREPProxy::getObjectOrientationFromName(const char* obj_name, const char* ref_name, const int& simport, const int& mode) {

	int objHandle, refHandle;
	Eigen::Matrix3f R;
	Eigen::Quaternionf q;
	objHandle = this->simObjects[obj_name];
	refHandle = (!std::string(ref_name).empty()) ? this->simObjects[ref_name] : -1;

	// q.coeffs() should have been stored in the order x, y, z, w, that should be the same as CoppeliaSim
	simxGetObjectQuaternion(this->portIdMap[simport], objHandle, refHandle, &q.coeffs()(0), mode);

	R = q.toRotationMatrix();
	return R;


}


/*
* @brief Collision check function
* Check if the two input objects in the CoppeliaSim scene are colliding
* @param obj1_name : the name of the first object
* @param obj2_name : the name of the second object
* @param simport : the simulation port of the connection(default is 19997)
* @param mode : the setting mode(default is simx_opmode_oneshot)
* @return true if the pair of objects is colliding, false otherwise
*/
bool VREPProxy::checkObjectCollision(const char* obj1_name, const char* obj2_name, const int& simport, const int& mode) {

	bool colliding = false;
	int obj1Handle, obj2Handle;
	simxUChar collisionState;

	obj1Handle = this->simObjects[obj1_name];
	obj2Handle = this->simObjects[obj2_name];

	simxCheckCollision(this->portIdMap[simport], obj1Handle, obj2Handle, &collisionState, mode);
	colliding = (bool)collisionState;

	return colliding;
}


/*
* @brief Collision check function
* Check if the two input objects in the CoppeliaSim scene are colliding
* @param obj1_name : the name of the first object
* @param obj2_name : the name of the second object
* @param simport : the simulation port of the connection(default is 19997)
* @param mode : the setting mode(default is simx_opmode_oneshot)
* @return the distance between the pair of objects
*/
float VREPProxy::checkObjectDistance(const char* obj1_name, const char* obj2_name, const int& simport, const int& mode) {

	float distance = 1000.0;
	int obj1Handle, obj2Handle;
	simxUChar collisionState;

	obj1Handle = this->simObjects[obj1_name];
	obj2Handle = this->simObjects[obj2_name];

	simxCheckDistance(this->portIdMap[simport], obj1Handle, obj2Handle, &distance, mode);

	return distance;


}


/**
* @brief Set function
* Set the input float value on the requested signal signalName
* @param signalName: name of the signal
* @param value: value to be set on the signal
* @param simport : the simulation port of the connection(default is 19997)
* @param mode : the setting mode(default is simx_opmode_oneshot)
*
*/
void VREPProxy::setFloatSignal(const char* signalName, const float& value, const int& simport, const int& mode) {

	simxSetFloatSignal(this->portIdMap[simport], signalName, value, mode);

}


/*
* @brief Add function
* Add the virtual object specified by the input name objName to
* the list simObjects of simulated objects in the CoppeliaSim scene
* @param objName: the name of the object to be added
* @return true if the object is present in the scene and is successfully added to the list
*
*/
bool VREPProxy::addSimObject(const char* objName, const int& simport, const int& mode) {

	bool ret = false;
	int handle;
	const char* name = objName;
	simxGetObjectHandle(this->portIdMap[simport], name, &handle, simx_opmode_blocking);
	
	if (handle > 0 && this->simObjects.find(std::string(objName)) == this->simObjects.end()) {

		this->simObjects.insert({ std::string(objName),handle });
		ret = true;

	}


	return ret;


}


/**
* @brief Set function
* Set the parent-child relationship between the two specified input objects
* @param childName: the child object
* @param parentName: the parent object
* @param simport : the simulation port of the connection(default is 19997)
* @param mode : the setting mode(default is simx_opmode_oneshot)
*
*/
void VREPProxy::setChildObject(const char* childName, const char* parentName, const int& simport, const int& mode) { 

	const char* name_c = childName;
	const char* name_p = parentName;
	std::cout << "name_c = " << name_c << std::endl;
	std::cout << "name_p = " << name_p << std::endl;
	simxSetObjectParent(this->portIdMap[simport], this->simObjects[std::string(name_c)], this->simObjects[std::string(name_p)], true, mode);

}

