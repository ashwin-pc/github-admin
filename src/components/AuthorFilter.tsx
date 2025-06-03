import { useState } from 'react';
import { ActionList, ActionMenu, FormControl, TextInput, Box, Button } from '@primer/react';
import { CheckIcon, PlusIcon, XIcon } from '@primer/octicons-react';

interface AuthorFilterProps {
  selectedAuthors: string[];
  availableAuthors: string[];
  onAuthorsChange: (authors: string[]) => void;
  onAvailableAuthorsChange: (authors: string[]) => void;
}

export const AuthorFilter = ({ 
  selectedAuthors, 
  availableAuthors, 
  onAuthorsChange, 
  onAvailableAuthorsChange 
}: AuthorFilterProps) => {
  const [newAuthor, setNewAuthor] = useState('');

  const toggleAuthor = (author: string) => {
    if (selectedAuthors.includes(author)) {
      onAuthorsChange(selectedAuthors.filter(a => a !== author));
    } else {
      onAuthorsChange([...selectedAuthors, author]);
    }
  };

  const addAuthors = () => {
    const authorsToAdd = newAuthor
      .split(',')
      .map(author => author.trim())
      .filter(author => author && !availableAuthors.includes(author));
    
    if (authorsToAdd.length > 0) {
      const updatedAvailable = [...availableAuthors, ...authorsToAdd];
      onAvailableAuthorsChange(updatedAvailable);
      onAuthorsChange([...selectedAuthors, ...authorsToAdd]);
      setNewAuthor('');
    }
  };

  const removeAuthor = (author: string) => {
    onAuthorsChange(selectedAuthors.filter(a => a !== author));
    onAvailableAuthorsChange(availableAuthors.filter(a => a !== author));
  };

  return (
    <ActionMenu>
      <ActionMenu.Button>
        Authors {selectedAuthors.length > 0 && `(${selectedAuthors.length})`}
      </ActionMenu.Button>
      <ActionMenu.Overlay width="medium">
        <Box sx={{ p: 3 }}>
          <FormControl sx={{ width: '100%' }}>
            <FormControl.Label>Add Authors</FormControl.Label>
            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
              <TextInput
                placeholder="Enter usernames (comma-separated)"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAuthors()}
                sx={{ flex: 1 }}
              />
              <Button
                size="small"
                onClick={addAuthors}
                disabled={!newAuthor.trim()}
                leadingVisual={PlusIcon}
                sx={{ flexShrink: 0 }}
              >
                Add
              </Button>
            </Box>
          </FormControl>
        </Box>
        {availableAuthors.length > 0 && (
          <Box sx={{ p: 2, pt: 1 }}>
            <Box sx={{ fontWeight: 'bold', fontSize: 0, mb: 1, color: 'fg.muted' }}>
              Available Authors
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {availableAuthors.map((author) => (
                <Box
                  key={author}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    fontSize: 1,
                    '&:hover': {
                      backgroundColor: 'canvas.subtle',
                    },
                  }}
                  onClick={() => toggleAuthor(author)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selectedAuthors.includes(author) ? (
                      <Box sx={{ color: 'success.fg' }}>
                        <CheckIcon size={12} />
                      </Box>
                    ) : (
                      <Box sx={{ width: 12, height: 12, border: '1px solid', borderColor: 'border.default', borderRadius: 1 }} />
                    )}
                    <Box sx={{ fontWeight: selectedAuthors.includes(author) ? 'bold' : 'normal' }}>
                      {author}
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    variant="invisible"
                    leadingVisual={XIcon}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAuthor(author);
                    }}
                    sx={{
                      color: 'danger.fg',
                      minHeight: '20px',
                      px: 1,
                      '&:hover': {
                        backgroundColor: 'danger.subtle',
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}
        {availableAuthors.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center', color: 'fg.muted' }}>
            No authors added. Add authors above to filter PRs.
          </Box>
        )}
      </ActionMenu.Overlay>
    </ActionMenu>
  );
};