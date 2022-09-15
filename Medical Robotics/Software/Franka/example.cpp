#include <iostream>
#include <Windows.h>
#include <conio.h>
#include <chrono>
#include <thread>

#include "VREPProxy.hpp"
#include "PANDARobot.hpp"
#include "Timer.hpp"

#define ESCAPE 27

Eigen::VectorXd torqueSaturation(const Eigen::VectorXd& in) {

	Eigen::VectorXd out;

	out = in;

	// Torque saturation
	double tMax1 = 87;// TODO: get from scene
	double tMax2 = 12;// TODO: get from scene
	double tMax = -1;// TODO: get from scene
	for (int i = 0; i < 7; ++i) {
		if (i < 4)
			tMax = tMax1;
		else
			tMax = tMax2;
		if (abs(out(i)) >= tMax)
			if (out(i) >= 0) {
				out(i) = tMax;
			}
			else {
				out(i) = -tMax;
			}
	}

	return out;

}



int main(int argc, char** argv) {

	// V-REP and Robot objects
	VREPProxy vrep;
	PANDARobot panda("PANDA");

	// Time variables
	Timer clock;
	double rate, Ts;
	int Tsus;

	// robot variables
	int jointNum;
	Eigen::VectorXd q, qd, tau, qdcmd, taucmd, g, fric, p, v;
	Eigen::MatrixXd C, M, cvec, J;

	// Init V-REP / CoppeliaSim
	vrep.setIPAddress("127.0.0.1");		// Set the IP address
	vrep.setSynchro(true);				// Set the synchronization flag
	vrep.init();						// Init V-REP 

	// Init the robot from V-REP scene
	jointNum = panda.getJointNum();
	q.setZero(jointNum);
	qd.setZero(jointNum);
	tau.setZero(jointNum);
	taucmd.setZero(jointNum);
	qdcmd.setZero(jointNum);
	g.setZero(jointNum);
	cvec.setZero(jointNum,1);
	fric.setZero(jointNum);
	J.setZero(3, jointNum);

	// Here we set the blocking flag because we need to iniitialize the structure
	vrep.getJointPosition(q, 19997, simx_opmode_blocking);						//joint position
	vrep.getJointVelocity(qd, 19997, simx_opmode_blocking);						//joint velocites
	vrep.getJointTorque(tau, 19997, simx_opmode_blocking);						//joint torques
	tau = -tau;
	panda.setDataTimestamp(0.0);

	std::cout << "Starting configuration of the PANDA robot read from the V-REP scene: " << std::endl;
	std::cout << "\t q = " << q.transpose() << std::endl;
	std::cout << "\t qd = " << qd.transpose() << std::endl;
	std::cout << "\t tau = " << tau.transpose() << std::endl;

	// Initialize the robot kinematics and dynamics
	panda.updateRobotState(q, Eigen::VectorXd::Zero(jointNum), tau, true);

	// Initialize the V-REP streaming of the robo state data 
	// Here we set the blocking flag because we need to iniitialize the structure
	std::thread robotThread;
	vrep.getJointPosition(q, 19997, simx_opmode_streaming);						//joint position
	vrep.getJointVelocity(qd, 19997, simx_opmode_streaming);						//joint velocites
	vrep.getJointTorque(tau, 19997, simx_opmode_streaming);						//joint torques
	tau = -tau;

	// Start the V-REP simulation
	vrep.startSim();

	// Execute 2 simulation steps such that the initialization script is execute before the control algorithm
	for (int i = 0; i < 2; i++) {
		// Trigger next simulation step (Blocking function call)
		simxSynchronousTrigger(vrep.getClientID());

		// The ping funcion is used to ensure that the above commands are surely executed in Vrep
		simxInt pingTime{ 0 };
		simxGetPingTime(vrep.getClientID(), &pingTime);
	}

	// Update again the robot state with the buffer flag (sanity check)
	vrep.getJointPosition(q, 19997, simx_opmode_buffer);						//joint position
	vrep.getJointVelocity(qd, 19997, simx_opmode_buffer);						//joint velocites
	vrep.getJointTorque(tau, 19997, simx_opmode_buffer);						//joint torques
	tau = -tau;
	panda.updateRobotState(q, qd, tau, true);


	std::cout << "Starting configuration of the PANDA robot after V-REP simulation launch: " << std::endl;
	std::cout << "\t q = " << q.transpose() << std::endl;
	std::cout << "\t qd = " << qd.transpose() << std::endl;
	std::cout << "\t tau = " << tau.transpose() << std::endl;


	g = panda.getModelDynParams().g;
	C = panda.getModelDynParams().C;
	M = panda.getModelDynParams().B;

	// Get the clock rate
	rate = 1.0 / 0.05; clock.getRate();
	Ts = 1.0 / rate;
	Tsus = (int)(Ts * 1e6);

	// Run the main loop
	bool running = true;
	while (running) {

		// Measure starting time
		auto tic_ = std::chrono::steady_clock::now();

		//----------------------------------------------------------------//
		// Do stuff here... 

		// Check keyboard inputs to exit from the loop
		if (_kbhit() == 1) {
			int key = _getch();
			// If the key is ESC, terminate
			if (key == ESCAPE) {
				running = false;
			}
		}

		// Trigger next simulation step (Blocking function call)
		simxSynchronousTrigger(vrep.getClientID());
		simxInt pingTime{ 0 };
		simxGetPingTime(vrep.getClientID(), &pingTime);

		// Read the current state of the robot
		vrep.getJointPosition(q, 19997, simx_opmode_buffer);						//joint position
		vrep.getJointVelocity(qd, 19997, simx_opmode_buffer);						//joint velocites
		vrep.getJointTorque(tau, 19997, simx_opmode_buffer);						//joint torques
		tau = -tau;
		panda.updateRobotState(q, qd, tau, true);

		// Get the matrices of the Lagrangian model
		M = panda.getModelDynParams().B;
		g = panda.getModelDynParams().g;
		fric = panda.getModelDynParams().f;
		C = panda.getModelDynParams().C;
		cvec = panda.getModelDynParams().cvec;

		// Cartesian torque control variables
		p = panda.getEEPosition();
		v = panda.getEEVelocity().topRows(3);
		J = panda.getJacobian().topRows(3);


		// ------ vvv Implement here the Control law vvv ---- //
		// Compute the control law
		taucmd.setZero(7);
		// taucmd = ...
		// ------ ^^^ Implement here the Control law ^^^ ---- //

		// Apply saturation
		taucmd = torqueSaturation(taucmd);

		// Apply the torque control inputs on the robot in the V-REP scene
		vrep.setJointTorque(taucmd, 19997, simx_opmode_oneshot);

		// Example of possible signals to be sent to show CoppeliaSim graphs
		simxSetFloatSignal(vrep.getClientID(), "tau1_model", -taucmd(0), simx_opmode_oneshot);
		simxSetFloatSignal(vrep.getClientID(), "tau2_model", -taucmd(1), simx_opmode_oneshot);
		simxSetFloatSignal(vrep.getClientID(), "tau3_model", -taucmd(2), simx_opmode_oneshot);
		simxSetFloatSignal(vrep.getClientID(), "tau4_model", -taucmd(3), simx_opmode_oneshot);
		simxSetFloatSignal(vrep.getClientID(), "tau5_model", -taucmd(4), simx_opmode_oneshot);
		simxSetFloatSignal(vrep.getClientID(), "tau6_model", -taucmd(5), simx_opmode_oneshot);
		simxSetFloatSignal(vrep.getClientID(), "tau7_model", -taucmd(6), simx_opmode_oneshot);

		simxSetFloatSignal(vrep.getClientID(), "x_error", err(0), simx_opmode_oneshot);
		simxSetFloatSignal(vrep.getClientID(), "y_error", err(1), simx_opmode_oneshot);
		simxSetFloatSignal(vrep.getClientID(), "z_error", err(2), simx_opmode_oneshot);


		//----------------------------------------------------------------//

		// Measure the ending time and the elapsed time
		auto toc_ = std::chrono::steady_clock::now();
		auto tictoc_ = round<std::chrono::microseconds>(toc_ - tic_).count();

		// delay until time to iterate again
		auto tac_ = toc_ + std::chrono::microseconds(Tsus - tictoc_);
		//auto tac_ = toc_ + std::chrono::microseconds(Tsus - pingTime);

		// Wait until Ts
		//std::this_thread::sleep_until(tac_);
		if (Tsus > tictoc_) {
			//std::this_thread::sleep_until(tac_);
		}
		else {
			tac_ = toc_;
		}

		// Print elapsed time / while loop frequency
		//std::cout << "toc - tic = " << 1.0 / (1e-6 * round<std::chrono::microseconds>(toc_ - tic_).count()) << " Hz" << std::endl;
		//std::cout << "Loop frequency = " << 1.0 / (1e-9 * (toc_ - tic_).count()) << " [Hz]" << std::endl;

	}

	// Stop simulation
	vrep.stopSim();

	// Close V-REP
	vrep.close();

	return 0;
}
