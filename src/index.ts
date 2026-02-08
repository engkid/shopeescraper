import express from 'express';
import router from './api/routes';

const app = express();
const PORT = 3000;

app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
