
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, User, Mail, Shield, Award, Plus, Edit, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';

type UserRole = 'ADMIN' | 'CITIZEN' | 'STAFF';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  points: number;
  createdAt: string;
  _count: {
    pickupRequests: number;
  };
}

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isEditPointsDialogOpen, setIsEditPointsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('CITIZEN');
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsOperation, setPointsOperation] = useState<'add' | 'subtract' | 'set'>('add');

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        return data.users.map((user: any) => ({
          ...user,
          role: user.role as UserRole
        })) as UserData[];
      } catch (error) {
        console.error('Error fetching users:', error);
        // Return dummy data if API fails
        return [
          {
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'ADMIN' as UserRole,
            points: 0,
            createdAt: new Date().toISOString(),
            _count: { pickupRequests: 0 }
          },
          {
            id: '2',
            name: 'Staff Member',
            email: 'staff@example.com',
            role: 'STAFF' as UserRole,
            points: 0,
            createdAt: new Date().toISOString(),
            _count: { pickupRequests: 0 }
          },
          {
            id: '3',
            name: 'John Citizen',
            email: 'john@example.com',
            role: 'CITIZEN' as UserRole,
            points: 120,
            createdAt: new Date().toISOString(),
            _count: { pickupRequests: 5 }
          },
          {
            id: '4',
            name: 'Jane Citizen',
            email: 'jane@example.com',
            role: 'CITIZEN' as UserRole,
            points: 85,
            createdAt: new Date().toISOString(),
            _count: { pickupRequests: 3 }
          },
          {
            id: '5',
            name: 'Mike Johnson',
            email: 'mike@example.com',
            role: 'CITIZEN' as UserRole,
            points: 65,
            createdAt: new Date().toISOString(),
            _count: { pickupRequests: 2 }
          }
        ];
      }
    }
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Role updated",
        description: `${data.user.name}'s role has been updated to ${data.user.role}.`,
      });
      
      // Close dialog and reset selected user
      setIsEditRoleDialogOpen(false);
      setSelectedUser(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive"
      });
    }
  });

  // Update user points mutation
  const updatePointsMutation = useMutation({
    mutationFn: async ({ userId, points, operation }: { userId: string; points: number; operation: string }) => {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/points`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ points, operation })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user points');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Points updated",
        description: `${data.user.name}'s points have been updated to ${data.user.points}.`,
      });
      
      // Close dialog and reset selected user
      setIsEditPointsDialogOpen(false);
      setSelectedUser(null);
      setPointsAmount(0);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update points",
        variant: "destructive"
      });
    }
  });

  const filteredUsers = users?.filter(user => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const handleEditRole = (user: UserData) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setIsEditRoleDialogOpen(true);
  };

  const handleEditPoints = (user: UserData) => {
    setSelectedUser(user);
    setPointsAmount(0);
    setPointsOperation('add');
    setIsEditPointsDialogOpen(true);
  };

  const handleRoleUpdate = () => {
    if (!selectedUser) return;
    
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: selectedRole
    });
  };

  const handlePointsUpdate = () => {
    if (!selectedUser) return;
    
    updatePointsMutation.mutate({
      userId: selectedUser.id,
      points: pointsAmount,
      operation: pointsOperation
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'STAFF': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'CITIZEN': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and reward points
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : users && users.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter(user => {
                      if (!searchTerm) return true;
                      const searchLower = searchTerm.toLowerCase();
                      return (
                        user.name.toLowerCase().includes(searchLower) ||
                        user.email.toLowerCase().includes(searchLower) ||
                        user.role.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.points}</TableCell>
                      <TableCell>{user._count.pickupRequests}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditRole(user)}>
                              <Shield className="mr-2 h-4 w-4" />
                              <span>Edit Role</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditPoints(user)}>
                              <Award className="mr-2 h-4 w-4" />
                              <span>Edit Points</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No users found.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role and permissions for this user.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as UserRole)}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="CITIZEN">Citizen</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="text-sm mt-2">
                  <p className="font-medium">Role Permissions:</p>
                  <ul className="list-disc pl-5 mt-1 text-muted-foreground">
                    {selectedRole === 'ADMIN' && (
                      <>
                        <li>Full system access</li>
                        <li>Manage all users and roles</li>
                        <li>Access to all system settings</li>
                        <li>View analytics and reports</li>
                      </>
                    )}
                    {selectedRole === 'STAFF' && (
                      <>
                        <li>Process pickup requests</li>
                        <li>Update bin statuses</li>
                        <li>Manage collection schedules</li>
                        <li>View citizen data</li>
                      </>
                    )}
                    {selectedRole === 'CITIZEN' && (
                      <>
                        <li>Request waste pickups</li>
                        <li>View recycling centers</li>
                        <li>Access waste guides</li>
                        <li>Earn and redeem points</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRoleUpdate}
              disabled={updateRoleMutation.isPending || !selectedUser || selectedRole === selectedUser.role}
            >
              {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Points Dialog */}
      <Dialog open={isEditPointsDialogOpen} onOpenChange={setIsEditPointsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Points</DialogTitle>
            <DialogDescription>
              Adjust reward points for this user.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">Current Points: {selectedUser.points}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="operation">Operation</Label>
                <Select
                  value={pointsOperation}
                  onValueChange={(value) => setPointsOperation(value as 'add' | 'subtract' | 'set')}
                >
                  <SelectTrigger id="operation">
                    <SelectValue placeholder="Select operation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Points</SelectItem>
                    <SelectItem value="subtract">Subtract Points</SelectItem>
                    <SelectItem value="set">Set to Specific Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="points">Points Amount</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="text-sm mt-2 p-3 bg-muted rounded-md">
                <p className="font-medium">Result:</p>
                <p className="mt-1">
                  {pointsOperation === 'add' && `${selectedUser.points} + ${pointsAmount} = ${selectedUser.points + pointsAmount} points`}
                  {pointsOperation === 'subtract' && `${selectedUser.points} - ${pointsAmount} = ${Math.max(0, selectedUser.points - pointsAmount)} points`}
                  {pointsOperation === 'set' && `New value: ${pointsAmount} points`}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditPointsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePointsUpdate}
              disabled={updatePointsMutation.isPending || !selectedUser || pointsAmount <= 0}
            >
              {updatePointsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function for role badge color
const getRoleBadgeColor = (role: 'ADMIN' | 'CITIZEN' | 'STAFF') => {
  switch (role) {
    case 'ADMIN': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'STAFF': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'CITIZEN': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

export default UserManagement;
