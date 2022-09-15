// Standard Header files
#define _USE_MATH_DEFINES
#include <cmath>
#include <iostream>
// Project Header files
#include "PANDARobot.hpp"
#include "utils.hpp"
#include "DBWrapper.hpp"

#include "franka_model.hpp"


int PANDARobot::frictionParamsNum;						//!< Number of parameters considered for the friction model
bool PANDARobot::withDeltaGravity;						//!< State if the computation of the dynamic model has to account also the locally estimated delta-gravity 

/**
* @brief Default constructor of the PANDARobot class
*/
PANDARobot::PANDARobot() : RobotInterface() {

	this->jointNum = PANDA_JOINT_NUM;
	this->initData();
	
}


/**
* @brief Default constructor of the PANDARobot class
* @param name_: the identifying name of the instrument in use
*/
PANDARobot::PANDARobot(const std::string& name_) : RobotInterface(name_) {

	this->jointNum = PANDA_JOINT_NUM;
	this->initData();

}


/**
* @brief Constructor of the RobotInterface class with name argument
* @param qnum the dofs of the robot
*/
PANDARobot::PANDARobot(const int& qnum) : RobotInterface(qnum) {

	this->initData();

}


/**
* @brief Init function
* Init all the dynamic data of the class with the known value of dofs of the
*/
void PANDARobot::initData() {

	RobotInterface::initData();

	this->resFriFbe.setZero();							//!< Cartesian Force vector at the end-effector wrt base frame, reconstructed from FRI residual
	this->detJJT = 0.0;
	this->detJTJ = 0.0;
	this->friResidual_off.setZero();

	//set DH parameters
	this->robDHPars.d(0) = 0.333;
	this->robDHPars.d(1) = 0;
	this->robDHPars.d(2) = 0.316;
	this->robDHPars.d(3) = 0;
	this->robDHPars.d(4) = 0.384;
	this->robDHPars.d(5) = 0;
	this->robDHPars.d(6) = 0;

	this->robDHPars.a(0) = 0;
	this->robDHPars.a(1) = 0;
	this->robDHPars.a(2) = 0;
	this->robDHPars.a(3) = 0.0825;
	this->robDHPars.a(4) = -0.0825;
	this->robDHPars.a(5) = 0;
	this->robDHPars.a(6) = 0.088;

	this->robDHPars.alpha(0) = 0;
	this->robDHPars.alpha(1) = -M_PI / 2;
	this->robDHPars.alpha(2) =  M_PI / 2;
	this->robDHPars.alpha(3) =  M_PI / 2;
	this->robDHPars.alpha(4) = -M_PI / 2;
	this->robDHPars.alpha(5) =	M_PI / 2;
	this->robDHPars.alpha(6) =	M_PI / 2;

	this->eeDHOffset = 0.107;

	this->TeeOffset.setIdentity();

}


/**
* @brief Init function
* Check the input pair of comment+value to assign the corresponding parameter
* The function assumes that configFile has been previously set
* @param comment: the string specifying the title comment of parameter
* @param value: the string specifying the value of the parameter
*/
void PANDARobot::loadParamsFromConfigFile(const std::string& comment, const std::string& value) {

	/* Please note that this function is called several times*/
	if (comment.find("Links length") != std::string::npos) {
		std::vector < double > vec = parseCSVLine(value);
		for (int j = 0; j < vec.size(); j++) {
			this->linkLengths__(j) = vec[j];
		}
	}
	else if (comment.find("Dynamic model with tool") != std::string::npos) {
		this->includeToolDynParams = (std::stod(value)) ? true : false;
	}
	else if (comment.find("With Friction") != std::string::npos) {
		this->withFriction = (std::stod(value)) ? true : false;
	}
	else if (comment.find("Use model-based residual") != std::string::npos) {
		this->withModelBasedResidual = (std::stod(value)) ? true : false;
	}
	else if (comment.find("Residual gain") != std::string::npos) {
		float gain = std::stod(value);
		this->resGain = Eigen::MatrixXd::Identity(PANDA_JOINT_NUM, PANDA_JOINT_NUM) * gain;
		this->invResGainDt = (Eigen::MatrixXd::Identity(PANDA_JOINT_NUM, PANDA_JOINT_NUM) + this->resGain * this->dt__).inverse();
	}
	else if (comment.find("Start on place") != std::string::npos) {
		this->startOnPlace = (std::stod(value)) ? true : false;
	}
	else if (comment.find("Residual offset") != std::string::npos) {
		this->withResOffset = (std::stod(value)) ? true : false;
	}
	else if (comment.find("Initial configuration") != std::string::npos) {
		std::vector < double > vec = parseCSVLine(value);
		for (int j = 0; j < vec.size(); j++) {
			this->jointMsrPosition__(j) = (vec[j]) * M_PI / 180.0;
			this->jointCmdPosition__(j) = (vec[j]) * M_PI / 180.0;
		}
	}


}

/**
* @brief Forward kinematics function
* Compute the forward kinematic of the robot, based on the current set value of this->jointPosition
* Internally set the array of homogeneous transformation matrices, i.e., this->Tbli
*/
void PANDARobot::computeKinematics() {

	// load DH parameter (modified convention from C. Gaz, M. Cognetti, A. Oliva, P. Robuffo Giordano, A. De Luca,
	//					'Dynamic Identification of the Franka Emika Panda Robot With Retrieval of Feasible Parameters Using Penalty-Based Opmization'. IEEE RA-L, 2019.)

	// they should be object variable, for now put them here
	Eigen::VectorXd d{this->robDHPars.d};
	Eigen::VectorXd a{this->robDHPars.a};
	Eigen::VectorXd alphas(this->robDHPars.alpha);
	Eigen::VectorXd theta(PANDA_JOINT_NUM);
	Eigen::Matrix4d TeeOffset;

	theta << this->jointMsrPosition__(0), this->jointMsrPosition__(1), this->jointMsrPosition__(2), this->jointMsrPosition__(3),
			 this->jointMsrPosition__(4), this->jointMsrPosition__(5), this->jointMsrPosition__(6); 

	Eigen::Matrix4d Ti[PANDA_JOINT_NUM+1]; //+1 due to E-E frame (modified DH frames)

	// Compute local transformation matrices from link i-1 to link i
	for (int i = LINK1; i <= LINK7; i++) {
		Ti[i] <<		        cos(theta(i)),				-sin(theta(i)),                 0,					  a(i),
		              cos(alphas(i))*sin(theta(i)), cos(alphas(i))*cos(theta(i)),	-sin(alphas(i)),	 -d(i)* sin(alphas(i)),
		              sin(alphas(i))*sin(theta(i)), sin(alphas(i))*cos(theta(i)),    cos(alphas(i)),      d(i)*cos(alphas(i)),
								0,							   0, 						   0,						1;
	}
	// Consider the last offset df from the Franka Panda DH table
	Ti[LINK7 + 1].setIdentity();
	Ti[LINK7 + 1](2, 3) = this->eeDHOffset;


	// Compute the homogeneous transformation matrices of the i-th link pose wrt the base frame
	this->Tbli__[0] = Ti[0];

	for (int i = LINK2; i <= LINK7; i++) {
		this->Tbli__[i] = this->Tbli__[i - 1] * Ti[i];
	}
	this->Tbli__[LINK7] = this->Tbli__[LINK7] * Ti[LINK7 + 1];//*/
	this->Tbee__ = this->Tbli__[LINK7];

	// Check if there are end-effector objects mounted at the robot tip.
	// If so, update robot kinematics and dynamics consistently
	Eigen::Matrix4d Tprev = this->Tbee__;
	if (this->tools.size() > 0) {
		for (int i = 0; i < this->tools.size(); i++) {
			Eigen::Matrix4d Tee = this->tools[i].getTee();
			this->Tbee__ = Tprev * Tee;
			Tprev = this->Tbee__;

			//std::cout << "[PandaRobot] Tee = \n " << Tee << std::endl;
		}
	}//*/


}

/**
* @brief Forward dynamics function
* Compute the dynamic model of the robot, based on the current set value of joint position, velocity and torques,
* along with the known dynamic parameters of the model
*/
#ifdef BUILD_PANDA_DYN_MODEL
void PANDARobot::computeDynamics() {

	Eigen::Vector7d  q, dq, tau, gravity, friction;
	Eigen::Matrix7d mass, coriolis;

	//get joint position and velocity
	q = this->getMsrJointPosition();
	dq = this->getMsrJointVelocity();
	tau = this->getMsrJointTorques().cast<double>();

	//get dynamics parameters (from  C. Gaz, M. Cognetti, A. Oliva, P. Robuffo Giordano, A. De Luca,
	//					      'Dynamic Identification of the Franka Emika Panda Robot With Retrieval of Feasible Parameters Using Penalty-Based Opmization'. IEEE RA-L, 2019.)
	//mass = MassMatrix(q);
	//coriolis = CoriolisMatrix(q, dq);
	//gravity = GravityVector(q);
	//friction = Friction(dq);


	/// FIRST VERSION OF THE FRANKA PANDA DYNAMIC MODEL LIBRARY
	//get_MassMatrix(q.data(), mass.data());
	//get_CoriolisMatrix(q.data(), dq.data(), coriolis.data());
	//get_GravityVector(q.data(), gravity.data());
	//get_FrictionTorque(dq.data(), friction.data());

	/// SECOND VERSION OF THE FRANKA PANDA DYNAMIC MODEL LIBRARY (+ ACCURACY & PAYLOAD ACCOUNT)
	/*mass = franka_model::computeFrankaMassMatrix(q);
	coriolis = franka_model::computeFrankaCoriolisMatrix(q, dq);
	gravity = franka_model::computeFrankaGravityVector(q);
	friction = franka_model::computeFrankaFrictionVector(dq);*/

	/// SECOND DLL-BASED VERSION OF THE FRANKA PANDA DYNAMIC MODEL LYBRARY
	double** B = new double* [PANDA_JOINT_NUM];
	double** C = new double* [PANDA_JOINT_NUM];
	double* g = new double[PANDA_JOINT_NUM];
	double* tauf = new double[PANDA_JOINT_NUM];
	double* dyn_pars_tip = new double[DYN_PARAMS_NUM];

	for (int i = 0; i < PANDA_JOINT_NUM; i++) {
		B[i] = new double[PANDA_JOINT_NUM];
		C[i] = new double[PANDA_JOINT_NUM];
	}

	// Test
	for (int i = 0; i < DYN_PARAMS_NUM; i++) {
		dyn_pars_tip[i] = 0.0;
	}

	// Antenna case
	if (this->tools.size() == 1) { // antenna case
		dyn_pars_tip[0] = 1.33;
		dyn_pars_tip[1] = +1.4096e-02;
		dyn_pars_tip[2] = -1.0729e-05;
		dyn_pars_tip[3] = +9.0000e-02;
	}


	computeFrankaMassMatrix(B, q.data(),dyn_pars_tip);
	computeFrankaCoriolisMatrix(C, q.data(), dq.data(), dyn_pars_tip);
	computeFrankaGravityVector(g, q.data(), dyn_pars_tip);
	computeFrankaFrictionVector(tauf, dq.data());

	//save dynamic parameters
	for (int i = 0; i < PANDA_JOINT_NUM; i++) {
		for (int j = 0; j < PANDA_JOINT_NUM; j++) {
			mass(i, j) = B[i][j];
			coriolis(i, j) = C[i][j];
			this->robDynPars.B(i, j) = mass(i,j);
			this->robDynPars.C(i, j) = coriolis(i,j);
		}
	}
	std::memcpy(gravity.data(), g, PANDA_JOINT_NUM * sizeof(double));
	std::memcpy(friction.data(), tauf, PANDA_JOINT_NUM * sizeof(double));
	
	// Delete dynamic matrices
	for (int i = 0; i < PANDA_JOINT_NUM; i++) delete[] B[i];
	for (int i = 0; i < PANDA_JOINT_NUM; i++) delete[] C[i];
	delete[] B;
	delete[] C;
	delete[] g;
	delete[] tauf;

	//*/


	this->robDynPars.g = gravity;
	this->robDynPars.f = friction;
	this->robDynPars.tau = tau;
	this->robDynPars.cvec = coriolis * dq;

}
#endif // BUILD_PANDA_DYN_MODEL

/**
* @brief Delta-friction computation function
* Compute the delta-friction contribution with the known joint positions and parameters of estimated the delta-dynamics
* @param qdot_k: the joint position vector
* @param qdot_k: the joint velocity vector
* @param fg: the estimated friction/gravity parameters
* @return the resulting delta friction torques
*/
Eigen::Vector7d PANDARobot::computeDeltaFriction(const Eigen::Vector7d& q_k, const Eigen::Vector7d& qdot_k, const Eigen::VectorXd& fg) {

	Eigen::Vector7d dtau_f;
	dtau_f.setZero();

	// The vector of the estimating parameters of the delta-dynamics should be arranged as follows
	// fg = [Fs1, Fv1, sigK1, ..., Fs7, Fv7, sigK7, mx1, my1, mz1, ... , mx7, my7, mz7, m1, ..., m7]^T

	for (int i = 0; i < PANDA_JOINT_NUM; i++) {

		double Fs = fg(i*frictionParamsNum + 0);
		double Fv = fg(i*frictionParamsNum + 1);
		double ki = fg(i*frictionParamsNum + 2);
		double expDen_k = (1.0 + exp(-ki * qdot_k(i)));
		dtau_f(i) = (Fs + Fv / expDen_k);

		if (frictionParamsNum == 4) {
			double Fq = fg(i*frictionParamsNum + 3);
			dtau_f(i) += Fq * q_k(i);
		}


	}


	return dtau_f;
}


/**
* @brief Delta-dynamics callback function
* The function computes the delta-dynamics of the robot model, from the current joint positions
* velocities and estimated dynamics parameters. The firm of the function needs to match the
* callback firm to be called from the Gauss-Newton estimation algorithm, in the related estimation task
* @param q: joint position data
* @param qdot: joint velocity data
* @param params: joint estimated friction parameters data
* @param fricParamsNum: the number of coefficients used for friction for each joint
* @param if params accounts gravity term or not
*/
Eigen::VectorXd PANDARobot::computeDeltaDynamics(
	const Eigen::VectorXd& q, 
	const Eigen::VectorXd& qdot, 
	const Eigen::VectorXd& params){

	Eigen::VectorXd deltaDyn;
	Eigen::VectorXd delta_friction;
	Eigen::VectorXd delta_gravity;
	int N, S, M;

	// Get the data sizes
	N = frictionParamsNum;
	S = (N * PANDA_JOINT_NUM);
	M = (PANDA_JOINT_NUM);
	//S = (withDeltaGravity) ? (N * JOINT_NUM + GRAVITY_DYN_PARAMS_NUM) : (N * JOINT_NUM);
	//M = (withDeltaGravity) ? (2 * JOINT_NUM) : (JOINT_NUM);
	deltaDyn.setZero(M);

	// Compute the delta-friction
	delta_friction = PANDARobot::computeDeltaFriction(q, qdot, params);

	// Compute the delta-gravity
	//delta_gravity = PANDARobot::computeDeltaGravity(q, params);

	//Fill the delta-dynamics vector
	//deltaDyn.topRows(JOINT_NUM) = delta_friction;
	deltaDyn = delta_friction;
	
	/*if (withDeltaGravity) {
		deltaDyn.bottomRows(JOINT_NUM) = delta_gravity;
	}//*/

	// Return the vector
	return deltaDyn;

}

/**
* @brief Delta-dynamics callback function
* The function computes the Jacobian matrix of the delta-dynamics of the robot model, from the current joint positions
* velocities and estimated dynamics parameters. The firm of the function needs to match the
* callback firm to be called from the Gauss-Newton estimation algorithm, in the related estimation task
* @param q: joint position data
* @param q: joint velocity data
* @param q: joint estimated friction parameters data
* @return the jacobian matrix
*/
Eigen::MatrixXd PANDARobot::computeDeltaDynJacobian(const Eigen::VectorXd& q, const Eigen::VectorXd& qdot, const Eigen::VectorXd& params) {

	Eigen::MatrixXd Jacobian, Jf, Jg;
	int N, S, M;

	// The vector of the estimating parameters of the delta-dynamics should be arranged as follows
	// fg = [Fs1, Fv1, sigK1, ..., Fs7, Fv7, sigK7, mx1, my1, mz1, ... , mx7, my7, mz7, m1, ..., m7]^T (size = 49)
	int fricOffset = frictionParamsNum * PANDA_JOINT_NUM; //<-- TODO: from file
	//int mxyzNum = SPACE_DIM * JOINT_NUM; //<-- TODO: from file
	//float g0 = -9.81; // [m/s^2]

	N = frictionParamsNum;
	S = (N * PANDA_JOINT_NUM);
	M = (PANDA_JOINT_NUM);

	//S = (withDeltaGravity) ? (N * JOINT_NUM + GRAVITY_DYN_PARAMS_NUM) : (N * JOINT_NUM);
	//M = (withDeltaGravity) ? (2 * JOINT_NUM) : (JOINT_NUM);

	Jacobian.setZero(M, S);
	Jf.setZero(PANDA_JOINT_NUM, N * PANDA_JOINT_NUM);
	//Jg.setZero(JOINT_NUM, GRAVITY_DYN_PARAMS_NUM);

	// Fill Jacobian for friction part	
	for (int i = 0; i < PANDA_JOINT_NUM; i++) {
		double Fv_i = params(N*i + 1);
		double Ki_i = params(N*i + 2);
		double expDen_i = (1.0 + exp(-Ki_i * qdot(i)));

		Jf(i, N*i + 0) = 1.0;
		Jf(i, N*i + 1) = 1.0 / expDen_i;
		Jf(i, N*i + 2) = Fv_i * qdot(i) * exp(-Ki_i*qdot(i)) / pow(expDen_i, 2);

		if (N == 4) {
			Jf(i, N*i + 3) = q(i);
		}
	}

	// Fill Jacobian for gravity part
	//Jg = PANDARobot::computeDeltaGravityJacobian(q, params);

	// Fill the Jacobian matrix
	//Jacobian.block(0,0,JOINT_NUM, N * JOINT_NUM) = Jf;
	//Jacobian.block(JOINT_NUM, N * JOINT_NUM, JOINT_NUM, GRAVITY_DYN_PARAMS_NUM) = Jg;
	Jacobian = Jf;

	// Return the jacobian matrix
	return Jacobian;

}


/**
* @brief Delta-gravity Jacobian computation function
* Compute the delta-gravity jacobian contribution with the known joint positions, velocities and parameters of estimated the delta-dynamics
* @param q_k: the joint position vector
* @param fg: the estimated friction/gravity parameters
* @return the resulting delta gravity Jacobian matrix
*/
/*Eigen::MatrixXd PANDARobot::computeDeltaGravityJacobian(const Eigen::Vector7d& q_k, const Eigen::VectorXd& fg) {

	Eigen::MatrixXd Jg;
	Jg.setZero(JOINT_NUM, GRAVITY_DYN_PARAMS_NUM);
	float g0 = -9.81; // [m/s^2]

	float q2 = q_k(1);
	float q3 = q_k(2);
	float q4 = q_k(3);
	float q5 = q_k(4);
	float q6 = q_k(5);
	float q7 = q_k(6);

	float t2 = cos(q2);
	float t3 = sin(q2);
	float t4 = cos(q3);
	float t5 = sin(q3);
	float t6 = cos(q4);
	float t7 = sin(q4);
	float t8 = cos(q5);
	float t9 = g0*t2*t4*t7;
	float t10 = t9 - g0*t3*t6;
	float t11 = sin(q5);
	float t12 = sin(q6);
	float t13 = cos(q6);
	float t14 = g0*t2*t5*t8;
	float t15 = g0*t3*t7*t11;
	float t16 = g0*t2*t4*t6*t11;
	float t17 = sin(q7);
	float t18 = cos(q7);
	float t19 = g0*t2*t4*t7*t13;
	float t20 = g0*t2*t5*t11*t12;
	float t21 = t19 + t20 - g0*t3*t6*t13 - g0*t3*t7*t8*t12 - g0*t2*t4*t6*t8*t12;
	float t22 = g0*t2*t4*t7*(3.9E1 / 1.0E2);
	float t24 = g0*t3*(2.0 / 5.0);
	float t25 = g0*t3*t6*(3.9E1 / 1.0E2);
	float t23 = t22 - t24 - t25;
	float t26 = g0*t3*t4*t8;
	float t27 = g0*t3*t4*t11*t12;
	float t28 = g0*t3*t5*t6*t8*t12;
	float t29 = t27 + t28 - g0*t3*t5*t7*t13;
	float t30 = g0*t3*t4*t6;
	float t31 = t30 - g0*t2*t7;
	float t32 = g0*t3*t4*t6*t13;
	float t33 = g0*t2*t6*t8*t12;
	float t34 = g0*t3*t4*t7*t8*t12;
	float t35 = t32 + t33 + t34 - g0*t2*t7*t13;
	float t36 = g0*t3*t4*t6*(3.9E1 / 1.0E2);
	float t38 = g0*t2*t7*(3.9E1 / 1.0E2);
	float t37 = t36 - t38;
	float t39 = g0*t3*t4*t6*t8;
	float t40 = g0*t3*t5*t8*t12;
	float t41 = g0*t3*t4*t6*t11*t12;
	float t42 = t40 + t41 - g0*t2*t7*t11*t12;
	float t43 = g0*t2*t7*t8*t13;
	float t44 = g0*t3*t5*t11*t13;
	float t45 = t43 + t44 - g0*t2*t6*t12 - g0*t3*t4*t7*t12 - g0*t3*t4*t6*t8*t13;

	Jg(1,3) = g0*t2;
	Jg(1,5) = -g0*t3;
	Jg(1,6) = g0*t2*t4;
	Jg(1,7) = g0*t3;
	Jg(1,8) = -g0*t2*t5;
	Jg(1,9) = g0*t3*t7 + g0*t2*t4*t6;
	Jg(1,10) = -g0*t2*t5;
	Jg(1,11) = t10;
	Jg(1,12) = -g0*t2*t5*t11 + g0*t3*t7*t8 + g0*t2*t4*t6*t8;
	Jg(1,13) = t10;
	Jg(1,14) = t14 + t15 + t16;
	Jg(1,15) = -g0*t3*t6*t12 + g0*t2*t4*t7*t12 - g0*t2*t5*t11*t13 + g0*t3*t7*t8*t13 + g0*t2*t4*t6*t8*t13;
	Jg(1,16) = -t14 - t15 - t16;
	Jg(1,17) = t21;
	Jg(1,18) = -g0*t2*t5*t8*t17 - g0*t3*t7*t11*t17 - g0*t3*t6*t12*t18 - g0*t2*t4*t6*t11*t17 + g0*t2*t4*t7*t12*t18 - g0*t2*t5*t11*t13*t18 + g0*t3*t7*t8*t13*t18 + g0*t2*t4*t6*t8*t13*t18;
	Jg(1,19) = -g0*t2*t5*t8*t18 + g0*t3*t6*t12*t17 - g0*t3*t7*t11*t18 - g0*t2*t4*t6*t11*t18 - g0*t2*t4*t7*t12*t17 + g0*t2*t5*t11*t13*t17 - g0*t3*t7*t8*t13*t17 - g0*t2*t4*t6*t8*t13*t17;
	Jg(1,20) = t21;
	Jg(1,23) = g0*t3*(-2.0 / 5.0);
	Jg(1,24) = g0*t3*(-2.0 / 5.0);
	Jg(1,25) = t23;
	Jg(1,26) = t23;
	Jg(1,27) = t23;
	Jg(2,6) = -g0*t3*t5;
	Jg(2,8) = -g0*t3*t4;
	Jg(2,9) = -g0*t3*t5*t6;
	Jg(2,10) = -g0*t3*t4;
	Jg(2,11) = -g0*t3*t5*t7;
	Jg(2,12) = -g0*t3*t4*t11 - g0*t3*t5*t6*t8;
	Jg(2,13) = -g0*t3*t5*t7;
	Jg(2,14) = t26 - g0*t3*t5*t6*t11;
	Jg(2,15) = -g0*t3*t5*t7*t12 - g0*t3*t4*t11*t13 - g0*t3*t5*t6*t8*t13;
	Jg(2,16) = -t26 + g0*t3*t5*t6*t11;
	Jg(2,17) = t29;
	Jg(2,18) = -g0*t3*t4*t8*t17 + g0*t3*t5*t6*t11*t17 - g0*t3*t5*t7*t12*t18 - g0*t3*t4*t11*t13*t18 - g0*t3*t5*t6*t8*t13*t18;
	Jg(2,19) = -g0*t3*t4*t8*t18 + g0*t3*t5*t6*t11*t18 + g0*t3*t5*t7*t12*t17 + g0*t3*t4*t11*t13*t17 + g0*t3*t5*t6*t8*t13*t17;
	Jg(2,20) = t29;
	Jg(2,25) = g0*t3*t5*t7*(-3.9E1 / 1.0E2);
	Jg(2,26) = g0*t3*t5*t7*(-3.9E1 / 1.0E2);
	Jg(2,27) = g0*t3*t5*t7*(-3.9E1 / 1.0E2);
	Jg(3,9) = -g0*t2*t6 - g0*t3*t4*t7;
	Jg(3,11) = t31;
	Jg(3,12) = -g0*t2*t6*t8 - g0*t3*t4*t7*t8;
	Jg(3,13) = t31;
	Jg(3,14) = -g0*t2*t6*t11 - g0*t3*t4*t7*t11;
	Jg(3,15) = -g0*t2*t7*t12 + g0*t3*t4*t6*t12 - g0*t2*t6*t8*t13 - g0*t3*t4*t7*t8*t13;
	Jg(3,16) = g0*t2*t6*t11 + g0*t3*t4*t7*t11;
	Jg(3,17) = t35;
	Jg(3,18) = g0*t2*t6*t11*t17 - g0*t2*t7*t12*t18 + g0*t3*t4*t7*t11*t17 + g0*t3*t4*t6*t12*t18 - g0*t2*t6*t8*t13*t18 - g0*t3*t4*t7*t8*t13*t18;
	Jg(3,19) = g0*t2*t6*t11*t18 + g0*t2*t7*t12*t17 - g0*t3*t4*t6*t12*t17 + g0*t3*t4*t7*t11*t18 + g0*t2*t6*t8*t13*t17 + g0*t3*t4*t7*t8*t13*t17;
	Jg(3,20) = t35;
	Jg(3,25) = t37;
	Jg(3,26) = t37;
	Jg(3,27) = t37;
	Jg(4,12) = -g0*t3*t5*t8 + g0*t2*t7*t11 - g0*t3*t4*t6*t11;
	Jg(4,14) = t39 - g0*t2*t7*t8 - g0*t3*t5*t11;
	Jg(4,15) = -g0*t3*t5*t8*t13 + g0*t2*t7*t11*t13 - g0*t3*t4*t6*t11*t13;
	Jg(4,16) = -t39 + g0*t2*t7*t8 + g0*t3*t5*t11;
	Jg(4,17) = t42;
	Jg(4,18) = g0*t2*t7*t8*t17 + g0*t3*t5*t11*t17 - g0*t3*t4*t6*t8*t17 - g0*t3*t5*t8*t13*t18 + g0*t2*t7*t11*t13*t18 - g0*t3*t4*t6*t11*t13*t18;
	Jg(4,19) = g0*t2*t7*t8*t18 + g0*t3*t5*t11*t18 - g0*t3*t4*t6*t8*t18 + g0*t3*t5*t8*t13*t17 - g0*t2*t7*t11*t13*t17 + g0*t3*t4*t6*t11*t13*t17;
	Jg(4,20) = t42;
	Jg(5,15) = g0*t2*t6*t13 + g0*t3*t4*t7*t13 + g0*t2*t7*t8*t12 + g0*t3*t5*t11*t12 - g0*t3*t4*t6*t8*t12;
	Jg(5,17) = t45;
	Jg(5,18) = g0*t2*t6*t13*t18 + g0*t3*t4*t7*t13*t18 + g0*t2*t7*t8*t12*t18 + g0*t3*t5*t11*t12*t18 - g0*t3*t4*t6*t8*t12*t18;
	Jg(5,19) = -g0*t2*t6*t13*t17 - g0*t3*t4*t7*t13*t17 - g0*t2*t7*t8*t12*t17 - g0*t3*t5*t11*t12*t17 + g0*t3*t4*t6*t8*t12*t17;
	Jg(5,20) = t45;
	Jg(6,18) = -g0*t3*t5*t8*t18 - g0*t2*t6*t12*t17 + g0*t2*t7*t11*t18 - g0*t3*t4*t6*t11*t18 - g0*t3*t4*t7*t12*t17 + g0*t2*t7*t8*t13*t17 + g0*t3*t5*t11*t13*t17 - g0*t3*t4*t6*t8*t13*t17;
	Jg(6,19) = g0*t3*t5*t8*t17 - g0*t2*t7*t11*t17 - g0*t2*t6*t12*t18 + g0*t3*t4*t6*t11*t17 - g0*t3*t4*t7*t12*t18 + g0*t2*t7*t8*t13*t18 + g0*t3*t5*t11*t13*t18 - g0*t3*t4*t6*t8*t13*t18;

	return Jg;
}//*/

/**
* @brief Delta-gravity computation function
* Compute the delta-gravity contribution with the known joint positions, velocities and parameters of estimated the delta-dynamics
* @param q_k: the joint position vector
* @param fg: the estimated friction/gravity parameters
* @return the resulting delta gravity torques
*/
/*Eigen::VectorXd PANDARobot::computeDeltaGravity(const Eigen::Vector7d& q_k, const Eigen::VectorXd& fg){

	Eigen::VectorXd dg;
	dg.setZero(JOINT_NUM);

	// The vector of the estimating parameters of the delta-dynamics should be arranged as follows
	// fg = [Fs1, Fv1, sigK1, ..., Fs7, Fv7, sigK7, mx1, my1, mz1, ... , mx7, my7, mz7, m1, ..., m7]^T (size = 49)
	int fricOffset = frictionParamsNum * JOINT_NUM; //<-- TODO: from file
	int mxyzNum = SPACE_DIM * JOINT_NUM; //<-- TODO: from file
	float g0 = -9.81; // [m/s^2]

	float MX2 = fg(fricOffset + 3);
	float MZ2 = fg(fricOffset + 5);
	float MX3 = fg(fricOffset + 6);
	float MY3 = fg(fricOffset + 7);
	float MZ3 = fg(fricOffset + 8);

	float MX4 = fg(fricOffset + 9);
	float MY4 = fg(fricOffset + 10);
	float MZ4 = fg(fricOffset + 11);

	float MX5 = fg(fricOffset + 12);
	float MY5 = fg(fricOffset + 13);
	float MZ5 = fg(fricOffset + 14);

	float MX6 = fg(fricOffset + 15);
	float MY6 = fg(fricOffset + 16);
	float MZ6 = fg(fricOffset + 17);

	float MX7 = fg(fricOffset + 18);
	float MY7 = fg(fricOffset + 19);
	float MZ7 = fg(fricOffset + 20);

	float m3 = fg(fricOffset + mxyzNum + 2);
	float m4 = fg(fricOffset + mxyzNum + 3);
	float m5 = fg(fricOffset + mxyzNum + 4);
	float m6 = fg(fricOffset + mxyzNum + 5);
	float m7 = fg(fricOffset + mxyzNum + 6);

	// Build the delta gravity
	float q2 = q_k(1);
	float q3 = q_k(2);
	float q4 = q_k(3);
	float q5 = q_k(4);
	float q6 = q_k(5);
	float q7 = q_k(6);
	float t2 = sin(q2);
	float t3 = cos(q2);
	float t4 = sin(q3);
	float t5 = cos(q4);
	float t6 = cos(q3);
	float t7 = sin(q4);
	float t8 = cos(q5);
	float t9 = cos(q6);
	float t10 = sin(q5);
	float t11 = sin(q6);
	float t12 = cos(q7);
	float t13 = sin(q7);


	dg(1) = MX2*g0*t3 + MY3*g0*t2 - MZ2*g0*t2 - g0*m3*t2*(2.0 / 5.0) - g0*m4*t2*(2.0 / 5.0) - g0*m5*t2*(2.0 / 5.0) - g0*m6*t2*(2.0 / 5.0) - g0*m7*t2*(2.0 / 5.0) - g0*m5*t2*t5*(3.9E1 / 1.0E2) - g0*m6*t2*t5*(3.9E1 / 1.0E2) - g0*m7*t2*t5*(3.9E1 / 1.0E2) + MX3*g0*t3*t6 + MX4*g0*t2*t7 - MY4*g0*t3*t4 - MY5*g0*t2*t5 - MZ3*g0*t3*t4 - MZ4*g0*t2*t5 + MX4*g0*t3*t5*t6 + MX5*g0*t2*t7*t8 - MX5*g0*t3*t4*t10 - MX6*g0*t2*t5*t11 + MY5*g0*t3*t6*t7 - MY6*g0*t3*t4*t8 - MY6*g0*t2*t7*t10 + MZ4*g0*t3*t6*t7 + MZ5*g0*t3*t4*t8 - MZ6*g0*t2*t5*t9 - MZ7*g0*t2*t5*t9 + MZ5*g0*t2*t7*t10 + g0*m5*t3*t6*t7*(3.9E1 / 1.0E2) + g0*m6*t3*t6*t7*(3.9E1 / 1.0E2) + g0*m7*t3*t6*t7*(3.9E1 / 1.0E2) + MX5*g0*t3*t5*t6*t8 + MX6*g0*t2*t7*t8*t9 - MX6*g0*t3*t4*t9*t10 + MX6*g0*t3*t6*t7*t11 - MX7*g0*t3*t4*t8*t13 - MX7*g0*t2*t5*t11*t12 - MX7*g0*t2*t7*t10*t13 - MY6*g0*t3*t5*t6*t10 - MY7*g0*t3*t4*t8*t12 + MY7*g0*t2*t5*t11*t13 - MY7*g0*t2*t7*t10*t12 + MZ5*g0*t3*t5*t6*t10 + MZ6*g0*t3*t6*t7*t9 + MZ7*g0*t3*t6*t7*t9 - MZ6*g0*t2*t7*t8*t11 + MZ6*g0*t3*t4*t10*t11 - MZ7*g0*t2*t7*t8*t11 + MZ7*g0*t3*t4*t10*t11 + MX6*g0*t3*t5*t6*t8*t9 - MX7*g0*t3*t5*t6*t10*t13 + MX7*g0*t2*t7*t8*t9*t12 - MX7*g0*t3*t4*t9*t10*t12 + MX7*g0*t3*t6*t7*t11*t12 - MY7*g0*t3*t5*t6*t10*t12 - MY7*g0*t2*t7*t8*t9*t13 + MY7*g0*t3*t4*t9*t10*t13 - MY7*g0*t3*t6*t7*t11*t13 - MZ6*g0*t3*t5*t6*t8*t11 - MZ7*g0*t3*t5*t6*t8*t11 + MX7*g0*t3*t5*t6*t8*t9*t12 - MY7*g0*t3*t5*t6*t8*t9*t13;
	dg(2) = -MX3*g0*t2*t4 - MY4*g0*t2*t6 - MZ3*g0*t2*t6 - MX4*g0*t2*t4*t5 - MX5*g0*t2*t6*t10 - MY5*g0*t2*t4*t7 - MY6*g0*t2*t6*t8 - MZ4*g0*t2*t4*t7 + MZ5*g0*t2*t6*t8 - g0*m5*t2*t4*t7*(3.9E1 / 1.0E2) - g0*m6*t2*t4*t7*(3.9E1 / 1.0E2) - g0*m7*t2*t4*t7*(3.9E1 / 1.0E2) - MX5*g0*t2*t4*t5*t8 - MX6*g0*t2*t4*t7*t11 - MX6*g0*t2*t6*t9*t10 - MX7*g0*t2*t6*t8*t13 + MY6*g0*t2*t4*t5*t10 - MY7*g0*t2*t6*t8*t12 - MZ5*g0*t2*t4*t5*t10 - MZ6*g0*t2*t4*t7*t9 - MZ7*g0*t2*t4*t7*t9 + MZ6*g0*t2*t6*t10*t11 + MZ7*g0*t2*t6*t10*t11 - MX6*g0*t2*t4*t5*t8*t9 + MX7*g0*t2*t4*t5*t10*t13 - MX7*g0*t2*t4*t7*t11*t12 - MX7*g0*t2*t6*t9*t10*t12 + MY7*g0*t2*t4*t5*t10*t12 + MY7*g0*t2*t4*t7*t11*t13 + MY7*g0*t2*t6*t9*t10*t13 + MZ6*g0*t2*t4*t5*t8*t11 + MZ7*g0*t2*t4*t5*t8*t11 - MX7*g0*t2*t4*t5*t8*t9*t12 + MY7*g0*t2*t4*t5*t8*t9*t13;
	dg(3) = g0*m5*t3*t7*(-3.9E1 / 1.0E2) - g0*m6*t3*t7*(3.9E1 / 1.0E2) - g0*m7*t3*t7*(3.9E1 / 1.0E2) - MX4*g0*t3*t5 - MY5*g0*t3*t7 - MZ4*g0*t3*t7 - MX4*g0*t2*t6*t7 - MX5*g0*t3*t5*t8 - MX6*g0*t3*t7*t11 + MY5*g0*t2*t5*t6 + MY6*g0*t3*t5*t10 + MZ4*g0*t2*t5*t6 - MZ5*g0*t3*t5*t10 - MZ6*g0*t3*t7*t9 - MZ7*g0*t3*t7*t9 + g0*m5*t2*t5*t6*(3.9E1 / 1.0E2) + g0*m6*t2*t5*t6*(3.9E1 / 1.0E2) + g0*m7*t2*t5*t6*(3.9E1 / 1.0E2) - MX5*g0*t2*t6*t7*t8 + MX6*g0*t2*t5*t6*t11 - MX6*g0*t3*t5*t8*t9 + MX7*g0*t3*t5*t10*t13 - MX7*g0*t3*t7*t11*t12 + MY6*g0*t2*t6*t7*t10 + MY7*g0*t3*t5*t10*t12 + MY7*g0*t3*t7*t11*t13 + MZ6*g0*t2*t5*t6*t9 + MZ7*g0*t2*t5*t6*t9 - MZ5*g0*t2*t6*t7*t10 + MZ6*g0*t3*t5*t8*t11 + MZ7*g0*t3*t5*t8*t11 - MX6*g0*t2*t6*t7*t8*t9 + MX7*g0*t2*t5*t6*t11*t12 - MX7*g0*t3*t5*t8*t9*t12 + MX7*g0*t2*t6*t7*t10*t13 - MY7*g0*t2*t5*t6*t11*t13 + MY7*g0*t2*t6*t7*t10*t12 + MY7*g0*t3*t5*t8*t9*t13 + MZ6*g0*t2*t6*t7*t8*t11 + MZ7*g0*t2*t6*t7*t8*t11 - MX7*g0*t2*t6*t7*t8*t9*t12 + MY7*g0*t2*t6*t7*t8*t9*t13;
	dg(4) = -MX5*g0*t2*t4*t8 + MX5*g0*t3*t7*t10 + MY6*g0*t2*t4*t10 + MY6*g0*t3*t7*t8 - MZ5*g0*t2*t4*t10 - MZ5*g0*t3*t7*t8 - MX5*g0*t2*t5*t6*t10 - MX6*g0*t2*t4*t8*t9 + MX6*g0*t3*t7*t9*t10 + MX7*g0*t2*t4*t10*t13 + MX7*g0*t3*t7*t8*t13 - MY6*g0*t2*t5*t6*t8 + MY7*g0*t2*t4*t10*t12 + MY7*g0*t3*t7*t8*t12 + MZ5*g0*t2*t5*t6*t8 + MZ6*g0*t2*t4*t8*t11 + MZ7*g0*t2*t4*t8*t11 - MZ6*g0*t3*t7*t10*t11 - MZ7*g0*t3*t7*t10*t11 - MX6*g0*t2*t5*t6*t9*t10 - MX7*g0*t2*t5*t6*t8*t13 - MX7*g0*t2*t4*t8*t9*t12 + MX7*g0*t3*t7*t9*t10*t12 - MY7*g0*t2*t5*t6*t8*t12 + MY7*g0*t2*t4*t8*t9*t13 - MY7*g0*t3*t7*t9*t10*t13 + MZ6*g0*t2*t5*t6*t10*t11 + MZ7*g0*t2*t5*t6*t10*t11 - MX7*g0*t2*t5*t6*t9*t10*t12 + MY7*g0*t2*t5*t6*t9*t10*t13;
	dg(5) = MX6*g0*t3*t5*t9 - MZ6*g0*t3*t5*t11 - MZ7*g0*t3*t5*t11 + MX6*g0*t2*t6*t7*t9 + MX6*g0*t2*t4*t10*t11 + MX6*g0*t3*t7*t8*t11 + MX7*g0*t3*t5*t9*t12 - MY7*g0*t3*t5*t9*t13 + MZ6*g0*t2*t4*t9*t10 - MZ6*g0*t2*t6*t7*t11 + MZ7*g0*t2*t4*t9*t10 + MZ6*g0*t3*t7*t8*t9 - MZ7*g0*t2*t6*t7*t11 + MZ7*g0*t3*t7*t8*t9 - MX6*g0*t2*t5*t6*t8*t11 + MX7*g0*t2*t6*t7*t9*t12 + MX7*g0*t2*t4*t10*t11*t12 + MX7*g0*t3*t7*t8*t11*t12 - MY7*g0*t2*t6*t7*t9*t13 - MY7*g0*t2*t4*t10*t11*t13 - MY7*g0*t3*t7*t8*t11*t13 - MZ6*g0*t2*t5*t6*t8*t9 - MZ7*g0*t2*t5*t6*t8*t9 - MX7*g0*t2*t5*t6*t8*t11*t12 + MY7*g0*t2*t5*t6*t8*t11*t13;
	dg(6) = -MX7*g0*t2*t4*t8*t12 - MX7*g0*t3*t5*t11*t13 + MX7*g0*t3*t7*t10*t12 + MY7*g0*t2*t4*t8*t13 - MY7*g0*t3*t5*t11*t12 - MY7*g0*t3*t7*t10*t13 - MX7*g0*t2*t5*t6*t10*t12 + MX7*g0*t2*t4*t9*t10*t13 - MX7*g0*t2*t6*t7*t11*t13 + MX7*g0*t3*t7*t8*t9*t13 + MY7*g0*t2*t5*t6*t10*t13 + MY7*g0*t2*t4*t9*t10*t12 - MY7*g0*t2*t6*t7*t11*t12 + MY7*g0*t3*t7*t8*t9*t12 - MX7*g0*t2*t5*t6*t8*t9*t13 - MY7*g0*t2*t5*t6*t8*t9*t12;

	return dg;
}//*/




/**
* @brief Jacobian function
* Compute the linear Jacobian matrix for the given chosen link (end-effector by default).
* @param link the link of which the Jacobian matrix has to be computed
* @return the requested Jacobian matrix
*/
Eigen::MatrixXd PANDARobot::computeLinearJacobian(const int& link) {
	//Eigen::VectorXd d{ this->robDHPars.d };
	//Eigen::VectorXd a{ this->robDHPars.a };
	//Eigen::VectorXd alphas(this->robDHPars.alpha);
	//Eigen::VectorXd theta(PANDA_JOINT_NUM);

	//Eigen::matrix4d dTi[PANDA_JOINT_NUM + 1]; //+1 due to E-E frame (modified DH frames)
	//Eigen::matrix4d Ti[PANDA_JOINT_NUM + 1]; //+1 due to E-E frame (modified DH frames)

	//Eigen::matrixXd Jl(SPACE_DIM, PANDA_JOINT_NUM);

	//theta << this->jointMsrPosition__(0), this->jointMsrPosition__(1), this->jointMsrPosition__(2), this->jointMsrPosition__(3),
	//	this->jointMsrPosition__(4), this->jointMsrPosition__(5), this->jointMsrPosition__(6);


	//// Compute local transformation matrices from link i-1 to link i
	//for (int i = LINK1; i <= END_EFFECTOR; i++) {
	//	Ti[i] <<		        cos(theta(i)),				-sin(theta(i)),                 0,					  a(i),
	//	              cos(alphas(i))*sin(theta(i)), cos(alphas(i))*cos(theta(i)),	-sin(alphas(i)),	 -d(i)* sin(alphas(i)),
	//	              sin(alphas(i))*sin(theta(i)), sin(alphas(i))*cos(theta(i)),    cos(alphas(i)),      d(i)*cos(alphas(i)),
	//							0,							   0, 						   0,						1;
	//}
	////Compute local transformation matrices from link i-1 to link i
	//for (int i = LINK1; i <= END_EFFECTOR; i++) {
	//	dTi[i] <<				-sin(theta(i)),					 -cos(theta(i)),			0,		 0,
	//					cos(alphas(i))*cos(theta(i)),	 -cos(alphas(i))*sin(theta(i)),		0,		 0,
	//					sin(alphas(i))*cos(theta(i)),	 -sin(alphas(i))*sin(theta(i)),		0,		 0,
	//								0,									0,					0,		 0;
	//}

	////add the offset due to modified DH convention and robot tool (if any)
	//Ti[END_EFFECTOR + 1].setIdentity();
	//Ti[END_EFFECTOR + 1](2, 3) = this->eeDHOffset + this->computeEEOffset();

	//Eigen::matrix4d dTbee; //derivative of the homogeneuos tranformation matrix of EE w.r.t. robot base
	//for (int l = LINK1; l <= link; ++l) {
	//	dTbee.setIdentity();
	//	for (int i = LINK1; i <= END_EFFECTOR; i++) {
	//		if (i == l)
	//			dTbee *= dTi[l];
	//		else
	//			dTbee *= Ti[i];
	//	}

	//	dTbee = dTbee * Ti[END_EFFECTOR + 1];
	//	//extract derivative of EE position w.r.t. robot base
	//	Jl(0, l) = dTbee(0, 3);
	//	Jl(1, l) = dTbee(1, 3);
	//	Jl(2, l) = dTbee(2, 3);
	//}


	Eigen::MatrixXd Jl(SPACE_DIM, PANDA_JOINT_NUM);
	Eigen::Vector3d zbl;
	Eigen::Vector3d pbl;
	Eigen::Vector3d pbee;
	Eigen::Vector3d pblee;
	Eigen::Vector3d j;
	
	Jl.setZero();
	zbl.setZero();
	pbl.setZero();
	pbee.setZero();
	pblee.setZero();
	j.setZero();
	
	pbee = this->getEEPosition().cast<double>();

	for (int l = LINK1; l <= link; ++l) {
		//extract derivative of EE position w.r.t. robot base
		zbl = this->getLinkRotMat(l).cast<double>().col(2).head(3);
		pbl = this->getLinkPosition(l).cast<double>();
		pblee = pbee - pbl;

		j = zbl.cross(pblee);
			
		Jl(0, l) = j(0);
		Jl(1, l) = j(1);
		Jl(2, l) = j(2);
	}

	return Jl;

}

/**
* @brief Jacobian function
* Compute the angular Jacobian matrix for the given chosen link (end-effector by default).
* @param link the link of which the Jacobian matrix has to be computed
* @return the requested Jacobian matrix
*/
Eigen::MatrixXd PANDARobot::computeAngularJacobian(const int& link) {
	
	Eigen::MatrixXd Ja(SPACE_DIM,PANDA_JOINT_NUM), Jaa(SPACE_DIM, PANDA_JOINT_NUM);
	Eigen::Matrix3d Trpy;

	for (int i = 0;i <= link;++i) { //<=link because in the modified convention zi is on joint i not i+1!
		Ja.col(i) = this->getLinkRotMat(i).col(2);
	}

	//transform angular jacobian to be consistent with the used angle representation (RPY)
	//Eigen::Matrix3d R{ this->getEERotMat() };
	Eigen::Vector3d rpy = rot2rpy(this->getEERotMat());

	//get RPY transformation matrix
	double cP = cos(rpy(1));
	double sP = sin(rpy(1));
	double cY = cos(rpy(2));
	double sY = sin(rpy(2));

	Trpy << cP*cY,	- sY,	0,
			cP*sY,	  cY,	0,
			 -sP,     0,	1;
	this->Trpy = Trpy;

	Jaa = Trpy.inverse() * Ja;

	//return Jaa;
	return Ja;
}


/**
* @brief Reset data
* Reset the robot data
*/
void PANDARobot::resetDynParams() {

	// Reset the cumulative contributions of the residual
	this->dynModelSum.setZero(this->jointNum);
	this->residualSum.setZero(this->jointNum);

	// Reset the residual
	this->res__.setZero(this->jointNum);

	// Compute the new offset to be taken into account in the computation of the residual
	Eigen::VectorXd g = this->getModelDynParams().g;
	Eigen::VectorXd tau = this->getMsrJointTorques();
	Eigen::VectorXd resOff = g - tau;
	this->setResidualVectorOffset(resOff);

	//std::cout << "Robot dynamic paramters reset. " << std::endl;
}


///**
//* @brief Set function
//* Save the friction parameters on a file
//* @param filename: the name of the file where the friction parameters have to be saved
//*/
//void PANDARobot::saveEstimatedFrictionParameters(const char* filename) {
//
//	std::stringstream fpSS;
//	DBWrapper db(filename);
//	Eigen::vectorXd fp;
//
//	fp = this->frictionGravityParams;
//	fpSS << "# Estimated friction parameters" << std::endl;
//	fpSS << "### Friction Parameters Size" << std::endl;
//	fpSS << frictionParamsNum << std::endl << std::endl;
//	fpSS << "### Friction Parameters Vector" << std::endl;
//	for (int i = 0; i < fp.size(); i++) {
//		fpSS << fp(i) << (i == fp.size() - 1 ? ";" : ",");
//	}
//
//	db.write(fpSS);
//
//}
//
///**
//* @brief Load function
//* Load the friction parameters from a file
//* @param filename: the name of the file where the friction parameters are stored
//*/
//void PANDARobot::loadEstimatedFrictionParameters(const char* filename) {
//
//	DBWrapper db(filename);
//	std::vector < std::pair < std::string, std::string > > content;
//
//	// Read the file
//	content = db.readLabeledFile();
//
//	// Parse the content file
//	for (int i = 0; i < content.size(); i++) {
//		std::string comment = content[i].first;
//		std::string value = content[i].second;
//
//		if (comment.find("Friction Parameters Size") != std::string::npos) {
//			frictionParamsNum = std::stod(value);
//		}
//		else if (comment.find("Friction Parameters Vector") != std::string::npos) {
//			std::vector < double > vec = parseCSVLine(value);
//			this->frictionGravityParams.setZero(vec.size());
//			for (int j = 0; j < vec.size(); j++) {
//				this->frictionGravityParams(j) = vec[j];
//			}
//		}
//	}
//
//	std::cout << "Friction paramters loaded = \n " << this->frictionGravityParams.transpose() << std::endl;
//
//}


