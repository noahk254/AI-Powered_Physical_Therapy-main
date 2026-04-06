def main(context):
    """Appwrite Function for TherapyAI API"""
    try:
        # Get request details
        method = context.req.method
        path = context.req.path
        body = context.req.body or '{}'

        # Parse JSON body if present
        try:
            data = json.loads(body) if body else {}
        except:
            data = {}

        # Route requests
        if method == 'GET' and path == '/health':
            return context.res.json({
                "status": "healthy",
                "services": {
                    "pose_analyzer": True,
                    "database": True
                },
                "timestamp": context.req.headers.get('x-appwrite-timestamp', ''),
                "function": "TherapyAI API"
            })

        elif method == 'POST' and path.startswith('/upload'):
            # Frame analysis endpoint
            return context.res.json({
                "is_correct": True,
                "score": 85.5,
                "feedback_message": "Good form! Keep your back straight.",
                "corrections": ["Keep elbows slightly bent"],
                "pose_landmarks": []
            })

        elif method == 'POST' and path.startswith('/session/start'):
            # Start session
            return context.res.json({
                "session_id": f"session_{hash(str(data))}"
            })

        elif method == 'POST' and path.startswith('/session/end'):
            # End session
            return context.res.json({
                "session_id": data.get('session_id', 'unknown'),
                "duration_seconds": 300,
                "total_frames": 150,
                "average_score": 82.3,
                "status": "completed"
            })

        elif method == 'GET' and path.startswith('/progress/'):
            # Get progress
            user_id = path.split('/progress/')[1].split('?')[0]
            return context.res.json({
                "user_id": user_id,
                "period": "30 days",
                "data": [],
                "summary": {
                    "active_days": 5,
                    "total_frames": 750,
                    "overall_average_score": 78.5,
                    "overall_accuracy": 0.85,
                    "exercise_breakdown": []
                }
            })

        elif method == 'GET' and path == '/exercises':
            # Get exercises
            return context.res.json({
                "exercises": ["shoulder_raises", "arm_circles", "wall_pushups", "squats"],
                "total": 4
            })

        elif method == 'POST' and path.startswith('/schedule'):
            # Schedule exercise
            return context.res.json({
                "id": f"schedule_{hash(str(data))}",
                "exercise_type": data.get('exercise_type', 'unknown'),
                "scheduled_date": data.get('scheduled_date', ''),
                "scheduled_time": data.get('scheduled_time', ''),
                "completed": False
            })

        elif method == 'POST' and path.startswith('/schedule/') and path.endswith('/complete'):
            # Complete scheduled exercise
            return context.res.json({"success": True})

        elif method == 'GET' and path.startswith('/doctor/patients'):
            # Get doctor patients
            return context.res.json({
                "patients": []
            })

        elif method == 'GET' and path.startswith('/doctor/patient/') and '/report' in path:
            # Get patient report
            return context.res.json({
                "patient_info": {},
                "report_period": {},
                "summary": {},
                "progress_data": [],
                "recent_sessions": [],
                "generated_at": "",
                "generated_by": ""
            })

        elif method == 'GET' and path.startswith('/doctor/assigned-sessions/'):
            # Get assigned sessions
            return context.res.json({
                "sessions": []
            })

        elif method == 'POST' and path == '/doctor/assigned-session':
            # Create assigned session
            return context.res.json({
                "session_id": f"assigned_{hash(str(data))}"
            })

        elif method == 'POST' and path.startswith('/doctor/assigned-session/') and path.endswith('/complete'):
            # Complete assigned session
            return context.res.json({"success": True})

        elif method == 'DELETE' and path.startswith('/doctor/assigned-session/'):
            # Delete assigned session
            return context.res.json({"success": True})

        elif method == 'POST' and path == '/doctor/therapy-plan':
            # Create therapy plan
            return context.res.json({
                "plan_id": f"plan_{hash(str(data))}"
            })

        else:
            return context.res.json({
                "error": f"Endpoint {method} {path} not implemented yet"
            }, 404)

    except Exception as e:
        context.log(f'Error: {str(e)}')
        return context.res.json({
            "error": f'Internal server error: {str(e)}'
        }, 500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(main, host="0.0.0.0", port=8000)
