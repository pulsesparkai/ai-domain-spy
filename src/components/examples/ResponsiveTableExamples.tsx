import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, responsiveTableClasses } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';

// Example of how to use the responsive table components

const ExampleTableData = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    status: "active",
    lastLogin: "2024-01-15"
  },
  {
    id: 2,
    name: "Jane Smith", 
    email: "jane@example.com",
    role: "User",
    status: "inactive",
    lastLogin: "2024-01-10"
  }
];

// Example 1: Using traditional table with responsive classes
export const TraditionalResponsiveTable = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead className={responsiveTableClasses.hideOnMobile}>Role</TableHead>
        <TableHead className={responsiveTableClasses.hideOnMobile}>Last Login</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {ExampleTableData.map((user) => (
        <TableRow key={user.id}>
          <TableCell className="font-medium">{user.name}</TableCell>
          <TableCell>{user.email}</TableCell>
          <TableCell className={responsiveTableClasses.hideOnMobile}>{user.role}</TableCell>
          <TableCell className={responsiveTableClasses.hideOnMobile}>{user.lastLogin}</TableCell>
          <TableCell>
            <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
              {user.status}
            </Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

// Example 2: Using ResponsiveTable component with automatic mobile cards
export const AutoResponsiveTable = () => {
  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'email',
      label: 'Email'
    },
    {
      key: 'role',
      label: 'Role',
      hideOnMobile: true
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      hideOnMobile: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'secondary'}>
          {value}
        </Badge>
      )
    }
  ];

  return (
    <ResponsiveTable 
      data={ExampleTableData}
      columns={columns}
    />
  );
};

// Example 3: Custom mobile card rendering
export const CustomMobileCardsTable = () => {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' }
  ];

  const customMobileCard = (user: any, index: number) => (
    <div key={index} className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{user.name}</h3>
        <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
          {user.status}
        </Badge>
      </div>
      <div className="space-y-2 text-sm">
        <p><span className="font-medium">Email:</span> {user.email}</p>
        <p><span className="font-medium">Role:</span> {user.role}</p>
        <p><span className="font-medium">Last Login:</span> {user.lastLogin}</p>
      </div>
    </div>
  );

  return (
    <ResponsiveTable 
      data={ExampleTableData}
      columns={columns}
      mobileCardRender={customMobileCard}
    />
  );
};