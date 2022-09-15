#ifndef ENDEFFECTOR_HPP_
#define ENDEFFECTOR_HPP_

// Project Header files
#include "Instrument.hpp"
#include "utils.hpp"

// Eigen Header files
#include <Eigen/Dense>

// Standard Header files
#include <cstring>

// Space dimension is 3...
#ifndef SPACE_DIM
#define SPACE_DIM 3
#endif // SPACE_DIM

// Index of the 3D axes
enum AXES{ X_AXIS = 0, Y_AXIS, Z_AXIS };


class EndEffector : public Instrument{

public:

	/**
	* @brief Default constructor of the EndEffector class
	*/
	EndEffector() : Instrument() {}

	/**
	* @brief Default constructor of the EndEffector class
	*/
	EndEffector(const std::string& name_) : Instrument(name_) {}

	/**
	* @brief Init function 
	* Check the input pair of comment+value to assign the corresponding parameter
	* The function assumes that configFile has been previously set
	* @param comment: the string specifying the title comment of parameter
	* @param value: the string specifying the value of the parameter
	*/
	void loadParamsFromConfigFile(const std::string& comment, const std::string& value);

	/**
	* @brief Default destroyer of the EndEffector class
	*/
	~EndEffector() {}

	/**
	* @brief Set function
	* Set the size of the End-Effector
	* @param s the size to be set
	*/
	inline void setSize(float s[]) { std::memcpy(this->size, s, SPACE_DIM * sizeof(float)); }

	/**
	* @brief Get function
	* Retrieves the size of the End-Effector
	* @return the requested size
	*/
	inline void getSize(float s[]) { std::memcpy(s, this->size, SPACE_DIM * sizeof(float)); }

	/**
	* @brief Set function
	* Set the CoM of the End-Effector
	* @param com the CoM to be set
	*/
	inline void setCoM(float com[]) { std::memcpy(this->CoM, com, SPACE_DIM * sizeof(float)); }

	/**
	* @brief Get function
	* Retrieves the CoM of the End-Effector
	* @return the requested CoM
	*/
	inline void getCoM(float com[]) { std::memcpy(com, this->CoM, SPACE_DIM * sizeof(float));	}

	/**
	* @brief Set function
	* Set the weight of the End-Effector
	* @param w the weight to be set
	*/
	inline void setWeight(const float& w) { this->weight = w; }

	/**
	* @brief Get function
	* Retrieves the weight of the End-Effector
	* @return the requested weight
	*/
	inline float getWeight() { return this->weight; }

	/**
	* @brief Set function
	* Set the homogeneous transformatioon Tee
	* @param T: the transformation to be set
	*/
	inline void setTee(const Eigen::Matrix4d& T) { this->Tee = T; }

	/**
	* @brief Get function
	* Get the homogeneous transformatioon Tee
	* @return the transformation to be set
	*/
	inline Eigen::Matrix4d getTee() { return this->Tee ; }

	/**
	* @brief Load function function
	* Load the homogeneous transformatioon Tee from file
	* @param the input filename where the transformation is stored
	* @return true if the transformation is successfully loaded
	*/
	bool loadTee(const char* filename);

protected:

	float size[SPACE_DIM];
	float CoM[SPACE_DIM];
	float weight;

	Eigen::Matrix4d Tee;	// Homogeneous trasnformation matrix to be set or loaded in order to update the kinematics of the robot at which the end-effector is mounted to
};

#endif //ENDEFFECTOR_HPP_
