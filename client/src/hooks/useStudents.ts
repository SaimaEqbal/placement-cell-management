import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import {
  deleteStudent,
  getStudentById,
  getStudents,
  updateStudent,
  type StudentRecord,
  type UpdateStudentPayload,
} from "../services/studentService";
import { queryKeys } from "./queryKeys";

/**Purpose: GET /students - list every student record, for the SPC/TPC/Admin dashboards. Filtering/searching (department, status, roll number) happens client-side over this one cached list - see those pages - rather than as separate queries per filter combination.*/
export function useStudents() {
  return useQuery<StudentRecord[], ApiError>({
    queryKey: queryKeys.students(),
    queryFn: getStudents,
  });
}

/** Purpose: GET /students/:id - a single student's full record, for the verification/review detail screen. */
export function useStudent(id: number | string | undefined) {
  return useQuery<StudentRecord, ApiError>({
    queryKey: queryKeys.student(id ?? "unknown"),
    queryFn: () => getStudentById(id as number | string),
    enabled: id !== undefined,
  });
}

/** Purpose: PUT /students/:id as the generic "edit a student record" action (Admin); invalidates both the list and that student's detail cache. */
export function useUpdateStudentRecord() {
  const queryClient = useQueryClient();

  return useMutation<
    StudentRecord,
    ApiError,
    { id: number | string; payload: UpdateStudentPayload }
  >({
    mutationFn: ({ id, payload }) => updateStudent(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students() });
      queryClient.invalidateQueries({ queryKey: queryKeys.student(variables.id) });
    },
  });
}

/** Purpose: DELETE /students/:id - remove a student record (Admin). */
export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students() });
    },
  });
}
